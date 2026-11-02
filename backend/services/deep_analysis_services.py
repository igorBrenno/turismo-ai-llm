from repositories.firebase import FirebaseReviewRepository
from adapters.ai import open_ai
from datetime import datetime, timezone
from google.cloud import firestore
from adapters.google_places.google_places import GooglePlacesAdapter
from collections import defaultdict
class CityDeepAnalysis:
    def __init__(self, db_repo: FirebaseReviewRepository, apify_adapter, google_adapter, llm_adapter):
        self.db = db_repo
        self.apify = apify_adapter
        self.google = google_adapter
        self.llm =  llm_adapter

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
        
    async def execute_heavy_analysis(self, place_id: str, city_name: str, spot_ids: list, spot_info: list):
        try:
            # 1. Puxa os dados do Apify
            reviews = self.apify.fetch_reviews(spot_ids, limit=30)
            
            if not reviews:
                print(f"[AVISO] Nenhum review encontrado para {city_name}.")
                await self.db.update_deep_analysis_status(place_id, "idle")
                return

            # 2. Agrupa os reviews por Spot
            from collections import defaultdict
            review_per_spot = defaultdict(list)
            
            for r in reviews:
                r_dict = r.model_dump() if hasattr(r, 'model_dump') else r
                review_per_spot[r_dict["place_id"]].append(r)  # <-- CORRIGIDO: Faltava o 'r' dentro do append
            
            spot_info_dict = {}
            for s in spot_info:
                s_dict = s.model_dump() if hasattr(s, 'model_dump') else s
                spot_info_dict[s_dict.get("place_id")] = s_dict
            
            all_alerts_city = []
            
            # 3. A IA analisa CADA SPOT individualmente
            for spot_id, spot_reviews in review_per_spot.items():
                print(f"🧠 IA Analisando spot: {spot_id}...")
                
                analise_spot = self.llm.analizar_reviews(spot_reviews)
                
                if spot_id in spot_info_dict:
                    spot_info_dict[spot_id]["danger_score"] = analise_spot.get("perigo_score", 0)
                    spot_info_dict[spot_id]["score_absoluto"] = analise_spot.get("score_absoluto", 0)
                    spot_info_dict[spot_id]["resumo_ia"] = analise_spot.get("resumo", "")
                    spot_info_dict[spot_id]["total_analisado_ia"] = analise_spot.get("total_reviews", 0)
                    
                if analise_spot.get("alertas"):
                    for alerta in analise_spot["alertas"]:
                        alerta["place_id"] = spot_id
                        all_alerts_city.append(alerta)
                        
            updated_spot_info = list(spot_info_dict.values())
            
            # 4. Salva Spots (com lat, lng e scores da IA) + Reviews em UMA SÓ VEZ
            # <-- CORRIGIDO: Passando a lista nova (updated_spot_info) que tem as notas da IA
            await self.db.save_spots_and_reviews(place_id, reviews, updated_spot_info)
            
            # 5. Atualiza o documento principal da cidade (Como a nota foi pros spots, aqui fica só o geral)
            from google.cloud import firestore # Certifique-se de que o firestore está importado no topo do arquivo
            await self.db.save_data_deep_analysis(place_id, {
                "city_name": city_name,
                "total_analisado": len(reviews),
                "ultima_atualizacao": firestore.SERVER_TIMESTAMP
            })
            
            # 6. Salva todos os alertas (crimes, golpes) separadamente na cidade
            if all_alerts_city:
                await self.db.save_alerts_deep_analysis(place_id, all_alerts_city)
            
            # 7. Libera o banco mudando para idle (Isso vai avisar o React!)
            await self.db.update_deep_analysis(place_id, "idle")
            print(f"[SUCESSO] Análise da cidade {city_name} concluída.")
            
        except Exception as e:
            print(f"[ERRO] Falha no processamento de {place_id}: {e}")
            await self.db.update_deep_analysis(place_id, "error")
    