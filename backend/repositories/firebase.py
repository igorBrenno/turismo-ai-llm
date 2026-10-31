from typing import Dict, Optional, Any, List, Set
from google.cloud import firestore
from google.cloud.firestore_v1.base_query import FieldFilter
from repositories.base import ReviewRepositorie, AlertRepository
from models.review import ReviewSchema
from config.firebase import init_firebase
from datetime import datetime, timezone

class FirebaseReviewRepository(ReviewRepositorie):
    def __init__(self):
        self.db = init_firebase()
        self.collection_name = "analysis_cache"
        self.global_collection_name = "global_status"
        self.global_doc_id = "metrics" 
        self.global_alert_collection = "alerts"
        self.deep_analysis_collection = "deep_analysis_status"
        
    async def get_analysis(self, place_id: str) -> Optional[Dict[str, Any]]:
        doc_ref = self.db.collection(self.collection_name).document(place_id)
        doc = await doc_ref.get()
        
        if doc.exists:
            print(f"[FIREBASE CACHE HIT] Dados encontrados para: {place_id}")
            return doc.to_dict()
        return None

    from google.cloud import firestore



    async def save_data(self, place_id: str, data: Dict[str, Any]) -> None:
        print(f"💾 [FIREBASE SAVE] Guardando dados em cache para: {place_id}")
        # 1. Salva o Cache Principal (como já estava)
        doc_ref = self.db.collection(self.collection_name).document(place_id)
        await doc_ref.set(data)
        
        
    async def save_alerts(self, place_id : str, alerts : Dict[str, Any]):
        if not alerts: return
        
        
        batch = self.db.batch()
        
        for alerta in alerts:
            review_id = alerta.get("review_id")
            if not review_id:
                continue
            doc_ref = self.db.collection(self.global_alert_collection).document(review_id)
            dados_alertas = {
                "place_id" : place_id,
                "review_id" : review_id,
                "tipo_perigo" : alerta.get("tipo_perigo"),
                "justificativa" : alerta.get("justificativa")
            }
            batch.set(doc_ref, dados_alertas)
        await batch.commit()
        print(f'[FIREBASE ALERT] {len(alerts)} novos alertas registrados para o local: {place_id}')
        
        
        
        
    async def save_spots_and_reviews(self, city_place_id : str, reviews : list ):
        if not reviews: return
        
        print(f"💾 [FIREBASE] Estruturando {len(reviews)} reviews aninhados para a cidade {city_place_id}...")
        
        
        tamanho_lote = 200
        
        lotes = [reviews[i:i + tamanho_lote] for  i in range (0, len(reviews), tamanho_lote) ]
        
        for lote in lotes:
            batch = self.db.batch()
            
            for r in lote:
                review_data = r.model_dump()
                
               
                spot_id = review_data.get("place_id") 
                review_id = review_data.get("review_id")
                
                if not spot_id or not review_id:
                    print(f"🚨 IGNORADO! Motivo -> spot_id: {spot_id} | review_id: {review_id}")
                    continue
                spot_ref = self.db.collection(self.deep_analysis_collection).document(city_place_id).collection("spots").document(spot_id)
                
                batch.set(spot_ref, {
                            "spot_id": spot_id,
                            "city_place_id": city_place_id,
                            "ultima_varredura": firestore.SERVER_TIMESTAMP
                        }, merge=True)
                        
                review_ref = spot_ref.collection("reviews").document(review_id)
                review_data = r.model_dump() if hasattr(r, 'model_dump') else r
                
                batch.set(review_ref, review_data, merge=True)
                
            await batch.commit()
            
        print(f"[SUCESSO] Spots e Reviews aninhados e salvos com sucesso na cidade!")
        
        
    async def get_deep_analysis( self, place_id : str, ) -> Optional[Dict[str, any]]:
        doc_ref = self.db.collection(self.deep_analysis_collection).document(place_id)
        doc = await doc_ref.get()
        if doc.exists:
            print(f"🔍 [DEEP ANALYSIS] Controle encontrado para: {place_id}")
            return doc.to_dict()
        return None
    
    
    async def update_deep_analysis(self, place_id : str, status : str) -> None:
        doc_ref = self.db.collection(self.deep_analysis_collection).document(place_id)
        update_data = {"analysis_status" : status}
        
        if status == "idle" :
            update_data["last_analyzed"] = datetime.now(timezone.utc)
            
            
        await doc_ref.set(update_data, merge=True)
        print(f"[DEEP ANALYSIS STATUS] {place_id} -> {status}")
    
        
    async def save_data_deep_analysis(self, place_id : str, data : Dict[str, Any]):
        print(f"💾 [FIREBASE SAVE] Guardando dados de analise profunda em cache para: {place_id}")
        doc_ref = self.db.collection(self.deep_analysis_collection).document(place_id)
        await doc_ref.set(data, merge=True)
    
    async def save_alerts_deep_analysis(self, place_id : str, alerts : Dict[str, Any]):
        if not alerts: return
        
        

        batch = self.db.batch()
        
        for alerta in alerts:
            review_id = alerta.get("review_id")
            if not review_id:
                continue
            doc_ref = self.db.collection(self.deep_analysis_collection).document(place_id).collection("alerts").document(review_id)
            dados_alertas = {
                "place_id" : place_id,
                "review_id" : review_id,
                "tipo_perigo" : alerta.get("tipo_perigo"),
                "justificativa" : alerta.get("justificativa")
            }
            batch.set(doc_ref, dados_alertas, merge=True)
        await batch.commit()
        print(f'[FIREBASE ALERT] {len(alerts)} novos alertas registrados para o local: {place_id}')


def _doc_id(*parts : str) -> str:
    # ids do Firestore não podem conter "/"
    return "_".join(parts).replace("/", "_")


class FirebaseAlertRepository(AlertRepository):
    def __init__(self):
        self.db = init_firebase()
        self.users_collection = "users"
        self.rules_subcollection = "alert_rules"
        self.reviews_collection = "reviews"
        self.cache_collection = "analysis_cache"
        self.checks_collection = "rule_checks"
        self.triggers_collection = "alert_triggers"
        self.runs_collection = "alert_runs"

    async def get_active_rules(self, uid : str) -> List[Dict[str, Any]]:
        rules_ref = self.db.collection(self.users_collection).document(uid).collection(self.rules_subcollection)
        query = rules_ref.where(filter=FieldFilter("ativo", "==", True))
        return [ { "id" : doc.id, **doc.to_dict() } async for doc in query.stream() ]

    async def save_reviews(self, place_id : str, reviews : List[ReviewSchema]):
        if not reviews: return

        batch = self.db.batch()
        for review in reviews:
            doc_ref = self.db.collection(self.reviews_collection).document(_doc_id(review.review_id))
            batch.set(doc_ref, { **review.model_dump(), "place_id" : place_id, "fetched_at" : firestore.SERVER_TIMESTAMP }, merge=True)
        await batch.commit()

    async def get_reviews(self, place_id : str) -> List[ReviewSchema]:
        reviews : Dict[str, ReviewSchema] = {}

        # Comentários salvos pela análise de segurança (tela de detalhes do ponto)
        cache_doc = await self.db.collection(self.cache_collection).document(place_id).get()
        if cache_doc.exists:
            for item in (cache_doc.to_dict() or {}).get("reviews", []):
                if item.get("review_id") and item.get("text"):
                    reviews[item["review_id"]] = ReviewSchema(**item)

        # Comentários salvos pelas execuções de alertas
        query = self.db.collection(self.reviews_collection).where(filter=FieldFilter("place_id", "==", place_id))
        async for doc in query.stream():
            item = doc.to_dict()
            reviews[item["review_id"]] = ReviewSchema(**{ k : item.get(k) for k in ReviewSchema.model_fields })

        return list(reviews.values())

    async def get_checked_review_ids(self, rule_id : str, criterio : str) -> Set[str]:
        query = (
            self.db.collection(self.checks_collection)
            .where(filter=FieldFilter("rule_id", "==", rule_id))
            .where(filter=FieldFilter("criterio", "==", criterio))
        )
        return { doc.to_dict().get("review_id") async for doc in query.stream() }

    async def save_rule_results(self, uid : str, rule : Dict[str, Any], resultados : List[Dict[str, Any]], reviews_by_id : Dict[str, ReviewSchema], place_by_review : Dict[str, str], place_names : Dict[str, str]) -> int:
        if not resultados: return 0

        batch = self.db.batch()
        disparos = 0
        for resultado in resultados:
            review_id = resultado["review_id"]
            doc_id = _doc_id(rule["id"], review_id)

            batch.set(self.db.collection(self.checks_collection).document(doc_id), {
                "owner_uid" : uid,
                "rule_id" : rule["id"],
                "criterio" : rule["criterio"],
                "review_id" : review_id,
                "casa" : resultado["casa"],
                "checked_at" : firestore.SERVER_TIMESTAMP,
            })

            if not resultado["casa"]:
                continue

            review = reviews_by_id[review_id]
            place_id = place_by_review.get(review_id, "")
            batch.set(self.db.collection(self.triggers_collection).document(doc_id), {
                "owner_uid" : uid,
                "rule_id" : rule["id"],
                "rule_nome" : rule.get("nome", ""),
                "place_id" : place_id,
                "place_nome" : place_names.get(place_id, ""),
                "review_id" : review_id,
                "review_texto" : review.text,
                "review_rating" : review.rating,
                "review_data" : review.date,
                "trecho" : resultado.get("trecho", ""),
                "status" : "novo",
                "created_at" : firestore.SERVER_TIMESTAMP,
            })
            disparos += 1

        await batch.commit()
        return disparos

    async def create_run(self, uid : str, total_locais : int) -> str:
        doc_ref = self.db.collection(self.runs_collection).document()
        await doc_ref.set({
            "owner_uid" : uid,
            "status" : "iniciando",
            "total_locais" : total_locais,
            "total_comentarios" : 0,
            "avaliacoes_pendentes" : 0,
            "avaliacoes_feitas" : 0,
            "disparos" : 0,
            "erro" : None,
            "started_at" : firestore.SERVER_TIMESTAMP,
            "finished_at" : None,
        })
        return doc_ref.id

    async def update_run(self, run_id : str, data : Dict[str, Any]):
        await self.db.collection(self.runs_collection).document(run_id).update(data)
