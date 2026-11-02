import asyncio
from google.cloud import firestore
from adapters.ai.base import AIAnalizerProviderAdapter
from adapters.reviews.base import ReviewProviderAdapter
from models.alert import RunAlertRulesRequest
from models.review import ReviewSchema
from repositories.base import AlertRepository

TAMANHO_DO_LOTE = 25


def dividir_em_lotes(lista : list, tamanho_lote : int):
    for i in range(0, len(lista), tamanho_lote):
        yield lista[i:i + tamanho_lote]


async def executar_regras_de_alerta(
    run_id : str,
    uid : str,
    request : RunAlertRulesRequest,
    repo : AlertRepository,
    review_adapter : ReviewProviderAdapter,
    ai_analyzer_adapter : AIAnalizerProviderAdapter,
):
    # Roda em segundo plano: o front acompanha o progresso pelo documento alert_runs/{run_id}
    try:
        rules = await repo.get_active_rules(uid)
        if not rules:
            await repo.update_run(run_id, { "status" : "concluido", "finished_at" : firestore.SERVER_TIMESTAMP })
            return

        place_names = { spot.place_id : spot.name for spot in request.spots }
        place_ids = list(place_names.keys())

        # 1. Busca os comentários mais recentes no Google (as chamadas do Apify são bloqueantes)
        if request.buscar_novos:
            await repo.update_run(run_id, { "status" : "buscando_comentarios" })
            novos = await asyncio.to_thread(review_adapter.fetch_latest_reviews, place_ids, request.reviews_por_local)
            for place_id, reviews in novos.items():
                await repo.save_reviews(place_id, reviews)

        # 2. Junta todos os comentários salvos dos locais da cidade
        reviews_by_id : dict[str, ReviewSchema] = {}
        place_by_review : dict[str, str] = {}
        for place_id in place_ids:
            for review in await repo.get_reviews(place_id):
                reviews_by_id[review.review_id] = review
                place_by_review[review.review_id] = place_id

        # 3. Para cada regra, separa só os comentários que ela ainda não avaliou
        pendentes_por_regra = []
        for rule in rules:
            checked = await repo.get_checked_review_ids(rule["id"], rule["criterio"])
            pendentes = [ r for r in reviews_by_id.values() if r.review_id not in checked ]
            pendentes_por_regra.append((rule, pendentes))

        total_pendentes = sum(len(p) for _, p in pendentes_por_regra)
        await repo.update_run(run_id, {
            "status" : "analisando",
            "total_comentarios" : len(reviews_by_id),
            "avaliacoes_pendentes" : total_pendentes,
        })

        # 4. Pergunta à IA lote a lote e salva logo em seguida, para não perder trabalho se algo falhar
        feitas = 0
        disparos = 0
        lotes_com_falha = 0
        for rule, pendentes in pendentes_por_regra:
            for lote in dividir_em_lotes(pendentes, TAMANHO_DO_LOTE):
                try:
                    resultados = await asyncio.to_thread(ai_analyzer_adapter.avaliar_regra, rule["criterio"], lote)
                    disparos += await repo.save_rule_results(uid, rule, resultados, reviews_by_id, place_by_review, place_names)
                except Exception as e:
                    # Um lote com erro não derruba a execução: sem registro em rule_checks, ele volta na próxima
                    print(f"Erro ao avaliar lote da regra {rule['id']}: {e}")
                    lotes_com_falha += 1
                feitas += len(lote)
                await repo.update_run(run_id, { "avaliacoes_feitas" : feitas, "disparos" : disparos })

        await repo.update_run(run_id, {
            "status" : "concluido",
            "lotes_com_falha" : lotes_com_falha,
            "finished_at" : firestore.SERVER_TIMESTAMP,
        })

    except Exception as e:
        print(f"Erro ao executar regras de alerta: {e}")
        await repo.update_run(run_id, { "status" : "erro", "erro" : "Falha ao processar os alertas. Tente novamente.", "finished_at" : firestore.SERVER_TIMESTAMP })
