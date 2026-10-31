from repositories.firebase import FirebaseReviewRepository
from adapters.ai import open_ai
from datetime import datetime, timezone
from google.cloud import firestore
from adapters.google_places.google_places import GooglePlacesAdapter
class CityDeepAnalysis:
    def __init__(self, db_repo: FirebaseReviewRepository, apify_adapter, google_adapter, llm_adapter):
        self.db = db_repo
        self.apify = apify_adapter
        self.google = google_adapter
        self. llm =  llm_adapter

    async def request_deep_analysis(self, place_id: str, force_refresh: bool = False):
        city_data = await self.db.get_deep_analysis(place_id)
        
        
        if city_data:
            if city_data.get("analysis_status") == "processing":
                return {"status": "processing", "message": "A cidade já está sendo analisada pela LLM."}
            last_analyzed = city_data.get("last_analyzed")
            if last_analyzed and not force_refresh:
                now = datetime.now(timezone.utc)
                diff_hours = (now - last_analyzed).total_seconds() / 3600
                if diff_hours < 24:
                    return {"status": "cached", "message": "Análise profunda recente já disponível."}
                
        
        await self.db.update_deep_analysis(place_id, "processing")
        return {"status": "started", "message": "Varredura profunda iniciada no background."}
        
    async def execute_heavy_analysis(self, place_id : str, city_name : str, spot_ids : list):
        try:
            # 1. Puxa os dados do Apify (usando a lista de spots recebida do Frontend)
            reviews = self.apify.fetch_reviews(spot_ids, limit=30)
            
            if not reviews:
                print(f"[AVISO] Nenhum review encontrado para {city_name}.")
                await self.db.update_deep_analysis_status(place_id, "idle")
                return

            # 2. Chama o seu adapter da IA
            
            
            analise_ia = self.llm.analizar_reviews(reviews)
            
            # 3. Salva os dados consolidados (score, resumo) no cache da cidade
            await self.db.save_data_deep_analysis(place_id, {
                "city_name": city_name,
                "perigo_score": analise_ia["perigo_score"],
                "score_absoluto": analise_ia["score_absoluto"],
                "resumo_ia": analise_ia["resumo"],
                "total_analisado": analise_ia["total_reviews"],
                "ultima_atualizacao": firestore.SERVER_TIMESTAMP
            })
            
            
            
            # 4. Salva os alertas (crimes, golpes) separadamente
            if analise_ia["alertas"]:
                await self.db.save_alerts_deep_analysis(place_id, analise_ia["alertas"])
            
            
            await self.db.save_spots_and_reviews(place_id, reviews)
            
            
            # 5. Libera o banco mudando para idle (Isso vai avisar o React!)
            await self.db.update_deep_analysis(place_id, "idle")
            print(f"[SUCESSO] Análise da cidade {city_name} concluída.")
            
        except Exception as e:
            print(f"[ERRO] Falha no processamento de {place_id}: {e}")
            await self.db.update_deep_analysis(place_id, "error")
    