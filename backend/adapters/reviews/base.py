from abc import ABC, abstractmethod
from models.review import ReviewSchema

class ReviewProviderAdapter(ABC):

    @abstractmethod
    def fetch_reviews(self, place_id : str, limit : int):
        # Vai pegar garoto, as reviews vai vai
        pass

    def fetch_latest_reviews(self, place_ids : list[str], limit_per_place : int) -> dict[str, list[ReviewSchema]]:
        # Busca os comentários mais recentes de vários locais. Implementação padrão: um local por vez.
        return { place_id : self.fetch_reviews(place_id=place_id, limit=limit_per_place) for place_id in place_ids }
