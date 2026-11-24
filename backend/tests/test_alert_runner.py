"""Unit tests for the custom alert rules runner."""
from models.alert import RunAlertRulesRequest
from services.alert_runner import TAMANHO_DO_LOTE, executar_regras_de_alerta
from tests.fakes import FakeAIAnalyzer, FakeAlertRepository, FakeReviewProvider, make_review

UID = "secretary-1"
RULE = {"id": "rule-1", "nome": "Accessibility", "criterio": "accessibility problems", "ativo": True}


def run_request(fetch_new: bool = False, spot_ids=("spot-1",), city_place_id=None) -> RunAlertRulesRequest:
    return RunAlertRulesRequest(
        spots=[{"place_id": spot_id, "name": f"Spot {spot_id}"} for spot_id in spot_ids],
        buscar_novos=fetch_new,
        city_place_id=city_place_id,
    )


async def execute(repo, provider=None, ai=None, request=None) -> dict:
    run_id = await repo.create_run(UID, total_locais=1)
    await executar_regras_de_alerta(
        run_id, UID, request or run_request(), repo, provider or FakeReviewProvider(), ai or FakeAIAnalyzer(),
    )
    return repo.runs[run_id]


async def test_without_active_rules_the_run_completes_without_calling_the_ai():
    repo = FakeAlertRepository(rules=[], stored_reviews={"spot-1": [make_review("r1")]})
    ai = FakeAIAnalyzer()

    run = await execute(repo, ai=ai)

    assert run["status"] == "concluido"
    assert ai.rule_batches == []


async def test_only_reviews_not_yet_checked_by_the_rule_are_sent_to_the_ai():
    repo = FakeAlertRepository(
        rules=[RULE],
        stored_reviews={"spot-1": [make_review("old"), make_review("new")]},
        checked={"rule-1": {"old"}},
    )
    ai = FakeAIAnalyzer()

    await execute(repo, ai=ai)

    assert [batch["review_ids"] for batch in ai.rule_batches] == [["new"]]


async def test_matching_reviews_are_counted_as_triggers():
    repo = FakeAlertRepository(
        rules=[RULE],
        stored_reviews={"spot-1": [make_review("r1"), make_review("r2"), make_review("r3")]},
    )
    ai = FakeAIAnalyzer(rule_matches={"r1", "r3"})

    run = await execute(repo, ai=ai)

    assert run["disparos"] == 2
    assert run["status"] == "concluido"


async def test_progress_reports_totals_and_completed_evaluations():
    repo = FakeAlertRepository(rules=[RULE], stored_reviews={"spot-1": [make_review(f"r{i}") for i in range(4)]})

    run = await execute(repo)

    assert run["total_comentarios"] == 4
    assert run["avaliacoes_pendentes"] == 4
    assert run["avaliacoes_feitas"] == 4


async def test_pending_reviews_are_evaluated_in_batches():
    total = TAMANHO_DO_LOTE + 5
    repo = FakeAlertRepository(rules=[RULE], stored_reviews={"spot-1": [make_review(f"r{i}") for i in range(total)]})
    ai = FakeAIAnalyzer()

    await execute(repo, ai=ai)

    assert [len(batch["review_ids"]) for batch in ai.rule_batches] == [TAMANHO_DO_LOTE, 5]


async def test_a_failed_batch_does_not_stop_the_run():
    total = TAMANHO_DO_LOTE + 5
    repo = FakeAlertRepository(rules=[RULE], stored_reviews={"spot-1": [make_review(f"r{i}") for i in range(total)]})
    ai = FakeAIAnalyzer(fail_on_calls={1})

    run = await execute(repo, ai=ai)

    assert run["status"] == "concluido"
    assert run["lotes_com_falha"] == 1
    assert len(repo.saved_results) == 1, "results of the failed batch must not be saved, so they are retried next run"


async def test_each_active_rule_is_evaluated_independently():
    second_rule = {"id": "rule-2", "nome": "Noise", "criterio": "noise complaints", "ativo": True}
    repo = FakeAlertRepository(rules=[RULE, second_rule], stored_reviews={"spot-1": [make_review("r1")]})
    ai = FakeAIAnalyzer()

    await execute(repo, ai=ai)

    assert [batch["criterio"] for batch in ai.rule_batches] == ["accessibility problems", "noise complaints"]


async def test_fetching_new_reviews_stores_them_before_evaluation():
    repo = FakeAlertRepository(rules=[RULE])
    provider = FakeReviewProvider([make_review("fresh", place_id="spot-1")])
    ai = FakeAIAnalyzer()

    await execute(repo, provider=provider, ai=ai, request=run_request(fetch_new=True))

    assert [r.review_id for r in repo.stored_reviews["spot-1"]] == ["fresh"]
    assert ai.rule_batches[0]["review_ids"] == ["fresh"]


async def test_new_reviews_are_not_fetched_when_not_requested():
    repo = FakeAlertRepository(rules=[RULE])
    provider = FakeReviewProvider([make_review("fresh", place_id="spot-1")])

    await execute(repo, provider=provider, request=run_request(fetch_new=False))

    assert provider.fetch_calls == []


async def test_unexpected_error_marks_the_run_as_failed():
    repo = FakeAlertRepository(rules_error=RuntimeError("Firestore unavailable"))

    run = await execute(repo)

    assert run["status"] == "erro"
    assert run["erro"]


def city_rule(rule_id: str, city_place_id):
    return {"id": rule_id, "nome": rule_id, "criterio": f"criterion of {rule_id}", "ativo": True, "city_place_id": city_place_id}


async def test_only_rules_of_the_requested_city_are_applied():
    repo = FakeAlertRepository(
        rules=[city_rule("rule-city-a", "city-a"), city_rule("rule-city-b", "city-b")],
        stored_reviews={"spot-1": [make_review("r1")]},
    )
    ai = FakeAIAnalyzer()

    await execute(repo, ai=ai, request=run_request(city_place_id="city-a"))

    assert [batch["criterio"] for batch in ai.rule_batches] == ["criterion of rule-city-a"]


async def test_rules_without_a_city_apply_to_any_city():
    repo = FakeAlertRepository(
        rules=[city_rule("rule-legacy", None), city_rule("rule-city-b", "city-b")],
        stored_reviews={"spot-1": [make_review("r1")]},
    )
    ai = FakeAIAnalyzer()

    await execute(repo, ai=ai, request=run_request(city_place_id="city-a"))

    assert [batch["criterio"] for batch in ai.rule_batches] == ["criterion of rule-legacy"]


async def test_all_rules_apply_when_no_city_is_requested():
    repo = FakeAlertRepository(
        rules=[city_rule("rule-city-a", "city-a"), city_rule("rule-city-b", "city-b")],
        stored_reviews={"spot-1": [make_review("r1")]},
    )
    ai = FakeAIAnalyzer()

    await execute(repo, ai=ai, request=run_request(city_place_id=None))

    assert len(ai.rule_batches) == 2
