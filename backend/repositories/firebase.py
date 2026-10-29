from typing import Dict, Optional, Any
from google.cloud import firestore  # Importação necessária para o Increment
from google.cloud.firestore_v1.base_query import FieldFilter
from repositories.base import ReviewRepositorie
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
            
