from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from openai import OpenAI
from repositories.firebase import FirebaseReviewRepository
from repositories.base import ReviewRepositorie
import os
import json
from dotenv import load_dotenv

# Adapters
from adapters.reviews.apify import ApifyReviewsAdapter
from adapters.reviews.base import ReviewProviderAdapter
from adapters.ai.base import AIAnalizerProviderAdapter
from adapters.ai.open_ai import OpenAIAdapter
from adapters.google_places.google_places import GooglePlacesAdapter

# Services (Importe o serviço que criamos)
from services.deep_analysis_services import CityDeepAnalysis

if os.path.exists(".env.local"):
    load_dotenv(dotenv_path=".env.local")
else:
    load_dotenv(dotenv_path=".env")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# INJEÇÃO DE DEPENDÊNCIAS
# ==========================================

def get_review_repositorie() -> ReviewRepositorie:
    return FirebaseReviewRepository()

def get_open_ai_adapter() -> AIAnalizerProviderAdapter:
    open_ai_token = os.getenv("OPENAI_API_KEY")
    if not open_ai_token:
        raise HTTPException(status_code=500, detail="Token do OpenAi não configurado")    
    return OpenAIAdapter(open_ai_token = open_ai_token)

def get_reviews_adapter() -> ReviewProviderAdapter:
    token =  os.getenv("APIFY_TOKEN")
    if not token:
        raise HTTPException(status_code=500, detail="Token do Apify não configurado.")
    return ApifyReviewsAdapter(token_apify=token)

def get_google_places_adapter() -> GooglePlacesAdapter:
    api_key = os.getenv("GOOGLE_PLACES_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Key da api do google maps não foi configurada.")
    return GooglePlacesAdapter(api_key=api_key)

def get_city_analysis_service(
    repo: FirebaseReviewRepository = Depends(get_review_repositorie),
    apify_adapter: ApifyReviewsAdapter = Depends(get_reviews_adapter),
    llm_adapter: OpenAIAdapter = Depends(get_open_ai_adapter),
    google_adapter: GooglePlacesAdapter = Depends(get_google_places_adapter),
) -> CityDeepAnalysis:
    # Injeta os adapters e o repositório dentro do serviço
    return CityDeepAnalysis(db_repo=repo, apify_adapter=apify_adapter, google_adapter=google_adapter, llm_adapter=llm_adapter)

# ==========================================
# SCHEMAS (Modelos de Entrada)
# ==========================================

class CityAnalysisRequest(BaseModel):
    place_id: str
    city_name: str
    spot_ids: List[str]
    force_refresh: bool = False

# ==========================================
# ROTAS
# ==========================================

# 1 (Dashboard - Assíncrona via Proxy e Background Task)
@app.post("/api/analyze-city")
async def analyze_city_endpoint(
    request: CityAnalysisRequest, 
    background_tasks: BackgroundTasks,
    analysis_service: CityDeepAnalysis = Depends(get_city_analysis_service)
):
    # 1. Bate no Proxy (Verifica status/cache e responde em milissegundos)
    result = await analysis_service.request_deep_analysis(request.place_id, request.force_refresh)
    
    # 2. Se o proxy decidir que precisa processar, joga a tarefa pesada para background
    if result["status"] == "started":
        background_tasks.add_task(
            analysis_service.execute_heavy_analysis, 
            request.place_id, 
            request.city_name,
            request.spot_ids
        )
        
    # 3. Devolve a resposta rápida pro Frontend (Não trava a tela)
    return result


# 2. Rota Original (Pesquisa de Ponto Específico - Síncrona)
@app.get("/api/spots/{place_id}/reviews")
async def get_spot_reviews(
    place_id: str, 
    limit: int = 50,
    review_adapter : ReviewProviderAdapter = Depends(get_reviews_adapter),
    ai_analyzer_adapter : AIAnalizerProviderAdapter = Depends(get_open_ai_adapter),
    repo : ReviewRepositorie = Depends(get_review_repositorie)
    ):     

    try:
        cached_analysis = await repo.get_analysis(place_id = place_id)
        if cached_analysis:
            return cached_analysis
            
        # 1. Extração dos comentários via Apify
        reviews_model = review_adapter.fetch_reviews(place_id=place_id, limit=limit)
        if not reviews_model:
            return {"total": 0, "reviews": [], "analise_ia": None}
        
        reviews_dict = [r.model_dump() for r in reviews_model]
        
        # 2. Análise da IA
        ai_analyzed_data = ai_analyzer_adapter.analizar_reviews(reviews=reviews_model)
        
        result_of_analysis = {
            "id" : place_id,
            "total": ai_analyzed_data.get("total_reviews", 0),
            "resumo" : ai_analyzed_data.get("resumo" , ""),
            "reviews": reviews_dict,
            "perigo_score" : ai_analyzed_data.get("perigo_score", 0),
        }
        
        # 3. Salva no banco de dados
        await repo.save_data(place_id=place_id, data= result_of_analysis)
        alerts = ai_analyzed_data.get("alertas", [])
        await repo.save_alerts( place_id = place_id, alerts=alerts)
        
        # 4. Retorna tudo junto para o Frontend
        return result_of_analysis

    except Exception as e:
        print(f"Erro no processamento: {e}")
        raise HTTPException(status_code=500, detail="Erro ao processar comentários e IA.")