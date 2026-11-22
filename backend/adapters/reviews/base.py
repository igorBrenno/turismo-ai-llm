from abc import ABC, abstractmethod
from typing import Any, Optional, Union
from models.review import ReviewSchema


class ReviewProviderAdapter(ABC):

    @abstractmethod
    def fetch_reviews(self, place_id: Union[str, list[str]], limit: Optional[int] = None) -> list[ReviewSchema]:
        """Busca avaliações de um local específico ou de uma lista de locais.
        Sem `limit`, vale o teto MAX_REVIEWS_PER_PLACE de config/limits.py."""
        pass

    def fetch_latest_reviews(self, place_ids: list[str], limit_per_place: Optional[int] = None) -> dict[str, list[ReviewSchema]]:
        """Busca os comentários mais recentes de vários locais (fallback padrão: um por vez)."""
        return {
            place_id: self.fetch_reviews(place_id=place_id, limit=limit_per_place)
            for place_id in place_ids
        }

    def get_usage_limits(self) -> dict[str, Any]:
        """Consulta o consumo e saldo disponível do provedor, se suportado."""
        return {
            "gasto_atual_usd": 0.0,
            "limite_mensal_usd": 0.0,
            "saldo_restante_usd": 0.0,
            "porcentagem_usada": 0.0,
            "status": "unsupported"
        }