from .base import ReviewProviderAdapter
from apify_client import ApifyClient
from models.review import ReviewSchema
from typing import List
class ApifyReviewsAdapter(ReviewProviderAdapter):

    def __init__(self, token_apify : str):
        self.client = ApifyClient(token_apify)
        
    def fetch_reviews(self, place_id : str | List[str], limit : int):
        # Aceita um id (tela de detalhes do ponto) ou uma lista de ids (análise profunda da cidade)
        place_ids = [place_id] if isinstance(place_id, str) else place_id
        run_input = {
            "placeIds" : place_ids,
            "maxReviews" : limit,
            "language" : "pt-BR",
            "personalData" : False
        }
        formattedReviews : List[ReviewSchema] = []

        for item in self._run_actor(run_input):
            review = self._to_review_schema(item)
            if review:
                formattedReviews.append(review)

        return formattedReviews

    def fetch_latest_reviews(self, place_ids : list[str], limit_per_place : int) -> dict[str, list[ReviewSchema]]:
        # Uma única execução do ator para todos os locais (mais rápido e barato que uma por local)
        if not place_ids:
            return {}
        run_input = {
            "placeIds" : place_ids,
            "maxReviews" : limit_per_place,
            "reviewsSort" : "newest",
            "language" : "pt-BR",
            "personalData" : False
        }
        reviews_por_local : dict[str, list[ReviewSchema]] = { place_id : [] for place_id in place_ids }

        for item in self._run_actor(run_input):
            place_id = item.get("placeId")
            review = self._to_review_schema(item)
            if review and place_id in reviews_por_local:
                reviews_por_local[place_id].append(review)

        return reviews_por_local

    def _run_actor(self, run_input : dict):
        actor = self.client.actor("compass/google-maps-reviews-scraper")

        run = actor.call(run_input=run_input)

        dataset_id = run.get("defaultDatasetId") if isinstance(run, dict) else getattr(run, "defaultDatasetId", None)

        if not dataset_id:
            dataset_id = getattr(run, "default_dataset_id",  None)
            
        formattedReviews : List[ReviewSchema] = []
        
        datasetItems = self.client.dataset(dataset_id).iterate_items()
        
        for item in datasetItems:
            text = item.get("text")
            
            author_label = "Local Guide" if item.get("isLocalGuide", True) else "Reviewer"
            if text:
                formattedReviews.append(
                    ReviewSchema(
                        review_id = item.get("reviewId"),
                        place_id = item.get("placeId"),
                        author = author_label,
                        rating = float(item.get("stars", 0)),
                        text = text,
                        date = item.get("publishedAtDate"),
                    )
                )
    
        return formattedReviews
        
        