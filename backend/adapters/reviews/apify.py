from .base import ReviewProviderAdapter
from apify_client import ApifyClient
from models.review import ReviewSchema
from typing import Any, List, Optional, Union, Dict
from config import limits


def limit_reviews_per_place(requested : Optional[int]) -> Optional[int]:
    # Aplica o teto de config/limits.py ao que foi pedido; None em ambos = sem limite
    values = [ value for value in (requested, limits.MAX_REVIEWS_PER_PLACE) if value is not None ]
    return min(values) if values else None


def with_reviews_limit(run_input : dict, requested : Optional[int]) -> dict:
    max_reviews = limit_reviews_per_place(requested)
    return run_input if max_reviews is None else { **run_input, "maxReviews" : max_reviews }

class ApifyReviewsAdapter(ReviewProviderAdapter):

    def __init__(self, token_apify : str):
        self.client = ApifyClient(token_apify)
        
    def fetch_reviews(self, place_id : Union[str, List[str]], limit : Optional[int] = None) -> List[ReviewSchema]:
        # Aceita um id (tela de detalhes do ponto) ou uma lista de ids (análise profunda da cidade)
        place_ids = [place_id] if isinstance(place_id, str) else place_id
        run_input = with_reviews_limit({
            "placeIds" : place_ids,
            "language" : "pt-BR",
            "personalData" : False
        }, limit)
        
        # Como o _run_actor já retorna a lista de ReviewSchema formatada, é só retornar direto!
        return self._run_actor(run_input)

    def fetch_latest_reviews(self, place_ids : List[str], limit_per_place : Optional[int] = None) -> Dict[str, List[ReviewSchema]]:
        # Uma única execução do ator para todos os locais
        if not place_ids:
            return {}
            
        run_input = with_reviews_limit({
            "placeIds" : place_ids,
            "reviewsSort" : "newest",
            "language" : "pt-BR",
            "personalData" : False
        }, limit_per_place)
        
        reviews_por_local : Dict[str, List[ReviewSchema]] = { place_id : [] for place_id in place_ids }

        # Pega a lista pronta de ReviewSchemas e separa nas "gavetas" de cada place_id
        for review in self._run_actor(run_input):
            # Acessamos como objeto (review.place_id) pois o _run_actor já os converteu
            if review.place_id and review.place_id in reviews_por_local:
                reviews_por_local[review.place_id].append(review)

        return reviews_por_local

    def _run_actor(self, run_input : dict) -> List[ReviewSchema]:
        actor = self.client.actor("compass/google-maps-reviews-scraper")
        run = actor.call(run_input=run_input)

        dataset_id = run.get("defaultDatasetId") if isinstance(run, dict) else getattr(run, "defaultDatasetId", None)

        if not dataset_id:
            dataset_id = getattr(run, "default_dataset_id",  None)

        if not dataset_id:
            return []

        # Converte cada item cru do Apify em ReviewSchema (descarta os sem texto/id) e devolve uma lista
        reviews : List[ReviewSchema] = []
        for item in self.client.dataset(dataset_id).iterate_items():
            review = self._to_review_schema(item)
            if review:
                reviews.append(review)
        return reviews

    def _to_review_schema(self, item : dict):
        text = item.get("text")
        if not text or not item.get("reviewId"):
            return None

        author_label = "Local Guide" if item.get("isLocalGuide", True) else "Reviewer"
        return ReviewSchema(
            review_id = item.get("reviewId"),
            place_id = item.get("placeId"),
            author = author_label,
            rating = float(item.get("stars", 0)),
            text = text,
            date = item.get("publishedAtDate"),
        )

    def get_usage_limits(self) -> Dict[str, Any]:
        """Retorna o consumo atual e o saldo restante em USD da conta Apify."""
        try:
            limits_data = self.client.user("me").limits()

            # apify-client >= 2 retorna um modelo Pydantic; versões antigas retornam dict
            if hasattr(limits_data, "model_dump"):
                limits_data = limits_data.model_dump(by_alias=True)
            limits_data = limits_data or {}

            current = limits_data.get("current") or {}
            limits = limits_data.get("limits") or {}

            gasto_usd = float(current.get("monthlyUsageUsd") or 0.0)
            limite_usd = float(limits.get("maxMonthlyUsageUsd") or 0.0)
            restante_usd = max(0.0, limite_usd - gasto_usd)
            porcentagem = round((gasto_usd / limite_usd) * 100, 1) if limite_usd > 0 else 0.0

            return {
                "gasto_atual_usd": round(gasto_usd, 4),
                "limite_mensal_usd": round(limite_usd, 2),
                "saldo_restante_usd": round(restante_usd, 4),
                "porcentagem_usada": porcentagem,
                "status": "ok" if restante_usd > 0.20 else "low_balance",
            }
        except Exception as e:
            print(f"[ERRO APIFY LIMITS] Falha ao consultar saldo: {e}")
            return {
                "gasto_atual_usd": 0.0,
                "limite_mensal_usd": 0.0,
                "saldo_restante_usd": 0.0,
                "porcentagem_usada": 0.0,
                "status": "error",
            }
