from .base import ReviewProviderAdapter
from apify_client import ApifyClient
from models.review import ReviewSchema
from typing import List, Union, Dict

class ApifyReviewsAdapter(ReviewProviderAdapter):

    def __init__(self, token_apify : str):
        self.client = ApifyClient(token_apify)
        
    def fetch_reviews(self, place_id : Union[str, List[str]], limit : int) -> List[ReviewSchema]:
        # Aceita um id (tela de detalhes do ponto) ou uma lista de ids (análise profunda da cidade)
        place_ids = [place_id] if isinstance(place_id, str) else place_id
        run_input = {
            "placeIds" : place_ids,
            "maxReviews" : limit,
            "language" : "pt-BR",
            "personalData" : False
        }
        
        # Como o _run_actor já retorna a lista de ReviewSchema formatada, é só retornar direto!
        return self._run_actor(run_input)

    def fetch_latest_reviews(self, place_ids : List[str], limit_per_place : int) -> Dict[str, List[ReviewSchema]]:
        # Uma única execução do ator para todos os locais
        if not place_ids:
            return {}
            
        run_input = {
            "placeIds" : place_ids,
            "maxReviews" : limit_per_place,
            "reviewsSort" : "newest",
            "language" : "pt-BR",
            "personalData" : False
        }
        
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

        return self.client.dataset(dataset_id).iterate_items()

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
