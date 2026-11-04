from abc import ABC, abstractmethod
from typing import Dict, Optional, Any, List, Set
from models.review import ReviewSchema
class ReviewRepositorie(ABC):
    
    
    @abstractmethod
    async def get_analysis( self, place_id : str) -> Optional[Dict]:
        # pega as analises e tras pro front se existirem
        pass

    @abstractmethod
    async def save_data( self, place_id : str, data : Dict[str,Any]):
        # salva dados de analises no banco de dados
        pass

class AlertRepository(ABC):

    @abstractmethod
    async def get_active_rules(self, uid : str) -> List[Dict[str, Any]]:
        # regras de alerta ativas criadas pelo secretário
        pass

    @abstractmethod
    async def save_reviews(self, place_id : str, reviews : List[ReviewSchema]):
        # guarda os comentários de um local, um documento por comentário
        pass

    @abstractmethod
    async def get_reviews(self, place_id : str) -> List[ReviewSchema]:
        # todos os comentários já salvos de um local
        pass

    @abstractmethod
    async def get_checked_review_ids(self, rule_id : str, criterio : str) -> Set[str]:
        # ids dos comentários já avaliados por essa regra (com esse critério)
        pass

    @abstractmethod
    async def save_rule_results(self, uid : str, rule : Dict[str, Any], resultados : List[Dict[str, Any]], reviews_by_id : Dict[str, ReviewSchema], place_by_review : Dict[str, str], place_names : Dict[str, str]) -> int:
        # salva as avaliações e cria os disparos; retorna quantos disparos foram criados
        pass

    @abstractmethod
    async def create_run(self, uid : str, total_locais : int) -> str:
        pass

    @abstractmethod
    async def update_run(self, run_id : str, data : Dict[str, Any]):
        pass
