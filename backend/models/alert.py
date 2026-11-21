from pydantic import BaseModel, Field
from typing import List, Optional

class SpotRefModel(BaseModel):
    place_id : str
    name : str = ""

class RunAlertRulesRequest(BaseModel):
    spots : List[SpotRefModel] = Field(min_length=1)
    # Se verdadeiro, busca os comentários mais recentes no Google antes de avaliar
    buscar_novos : bool = True
    reviews_por_local : int = Field(default=20, ge=1, le=100)
    # Cidade dos spots enviados: só as regras dessa cidade (ou sem cidade definida) são aplicadas
    city_place_id : Optional[str] = None
