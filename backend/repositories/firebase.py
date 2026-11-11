from typing import Dict, List, Optional, Any
from google.cloud import firestore  # Importação necessária para o Increment
from google.cloud.firestore_v1.base_query import FieldFilter
from repositories.base import ReviewRepositorie
from config.firebase import init_firebase


class FirebaseReviewRepository(ReviewRepositorie):
    def __init__(self):
        self.db = init_firebase()
        self.collection_name = "analysis_cache"
        self.global_collection_name = "global_status"
        self.global_doc_id = "metrics" 
        self.global_alert_collection = "alerts"
        self.user_reports_collection = "user_reports"
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
                "justificativa" : alerta.get("justificativa"),
                "resolvida" : False
            }
            batch.set(doc_ref, dados_alertas)
        await batch.commit()
        print(f'[FIREBASE ALERT] {len(alerts)} novos alertas registrados para o local: {place_id}')

    async def save_user_report(self, data: Dict[str, Any]) -> str:
        doc_ref = self.db.collection(self.user_reports_collection).document()
        await doc_ref.set(data)
        return doc_ref.id

    async def list_user_reports(self, limit: int = 50) -> List[Dict[str, Any]]:
        query = (
            self.db.collection(self.user_reports_collection)
            .order_by("criado_em", direction=firestore.Query.DESCENDING)
            .limit(limit)
        )
        return [{**doc.to_dict(), "id": doc.id} async for doc in query.stream()]

            
