from abc import ABC, abstractmethod
from typing import Dict, List, Optional,  Any
class ReviewRepositorie(ABC):
    
    
    @abstractmethod
    async def get_analysis( self, place_id : str) -> Optional[Dict]:
        # pega as analises e tras pro front se existirem
        pass

    @abstractmethod
    async def save_data( self, place_id : str, data : Dict[str,Any]):
        # salva dados de analises no banco de dados
        pass

    @abstractmethod
    async def save_user_report( self, data : Dict[str,Any]) -> str:
        # salva uma denuncia feita por usuario e retorna o id gerado
        pass

    @abstractmethod
    async def list_user_reports( self, limit : int = 50) -> List[Dict[str,Any]]:
        # lista as denuncias de usuarios, das mais recentes para as mais antigas
        pass