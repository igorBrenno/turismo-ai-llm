from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from repositories.firebase import FirebaseReviewRepository
from repositories.base import ReviewRepositorie
import os
import json
from dotenv import load_dotenv
from adapters.reviews.apify import ApifyReviewsAdapter
from adapters.reviews.base import ReviewProviderAdapter
from adapters.ai.base import AIAnalizerProviderAdapter
from adapters.ai.open_ai import OpenAIAdapter
from config.auth import get_current_user
from models.report import UserReportCreate, UserReportPublic
from datetime import datetime, timezone
from typing import Any, Dict, List

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
        
        
        
        
        ai_analyzed_data = ai_analyzer_adapter.analizar_reviews(reviews=reviews_model)
        
        result_of_analysis = {
            "id" : place_id,
            "total": ai_analyzed_data.get("total_reviews", 0),
            "resumo" : ai_analyzed_data.get("resumo" , ""),
            "reviews": reviews_dict,
            "perigo_score" : ai_analyzed_data.get("perigo_score", 0),
            
        }
        await repo.save_data(place_id=place_id, data= result_of_analysis)
        alerts = ai_analyzed_data.get("alertas", [])
        await repo.save_alerts( place_id = place_id, alerts=alerts)
        
        # 4. Retorna tudo junto para o Frontend
        return result_of_analysis

    except Exception as e:
        print(f"Erro no processamento: {e}")
        raise HTTPException(status_code=500, detail="Erro ao processar comentários e IA.")


@app.post("/api/reports", response_model=UserReportPublic, status_code=201)
async def create_user_report(
    report: UserReportCreate,
    user: Dict[str, Any] = Depends(get_current_user),
    repo: ReviewRepositorie = Depends(get_review_repositorie),
):
    data = {
        **report.model_dump(mode="json"),
        "origem": "usuario",
        "uid": user["uid"],
        "author": user.get("name") or user.get("email") or "Usuário",
        "resolvida": False,
        "status": "pendente",
        "criado_em": datetime.now(timezone.utc),
    }
    try:
        report_id = await repo.save_user_report(data)
    except Exception as e:
        print(f"Erro ao salvar denúncia: {e}")
        raise HTTPException(status_code=500, detail="Erro ao registrar a denúncia.")
    return {**data, "id": report_id}


@app.get("/api/reports", response_model=List[UserReportPublic])
async def list_user_reports(
    user: Dict[str, Any] = Depends(get_current_user),
    repo: ReviewRepositorie = Depends(get_review_repositorie),
):
    try:
        return await repo.list_user_reports()
    except Exception as e:
        print(f"Erro ao listar denúncias: {e}")
        raise HTTPException(status_code=500, detail="Erro ao listar as denúncias.")