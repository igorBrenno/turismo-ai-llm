from .base import ReviewProviderAdapter
from apify_client import ApifyClient
from models.review import ReviewSchema
from typing import List
class ApifyReviewsAdapter(ReviewProviderAdapter):
    
    def __init__(self, token_apify : str):
        self.client = ApifyClient(token_apify)
        
    def fetch_reviews(self, place_id : List[str], limit : int):
        run_input = {
            "placeIds" : place_id,
            "maxReviews" : limit,
            "language" : "pt-BR",
            "personalData" : False
        }
        actor = self.client.actor("compass/google-maps-reviews-scraper")
        
        run = actor.call(run_input=run_input)
        
        dataset_id = run.get("defaultDataSetId") if isinstance(run, dict) else getattr(run, "defaultDatasetId", None)
        
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
                        author = author_label,
                        rating = float(item.get("stars", 0)),
                        text = text,
                        date = item.get("publishedAtDate"),
                    )
                )
    
        return formattedReviews
        
        