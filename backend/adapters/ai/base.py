from abc import ABC, abstractmethod
from models.analysis import AnalyzeAIModel
from models.review import ReviewSchema
class AIAnalizerProviderAdapter(ABC):
    @abstractmethod
    def analizar_reviews(self, texts : list[str] ) -> AnalyzeAIModel:
        # Recebe textos pra analisar com o Open Ai #
        pass

    @abstractmethod
    def avaliar_regra(self, criterio : str, reviews : list[ReviewSchema]) -> list[dict]:
        # Diz, para cada review, se ele se enquadra no critério escrito pelo secretário.
        # Retorna [{ "review_id": str, "casa": bool, "trecho": str }] #
        pass
