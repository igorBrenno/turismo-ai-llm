from pydantic import BaseModel, Field
from typing import List

class SpotRefModel(BaseModel):
    place_id : str
    name : str = ""

class RunAlertRulesRequest(BaseModel):
    spots : List[SpotRefModel] = Field(min_length=1, max_length=200)
    # Se verdadeiro, busca os comentários mais recentes no Google antes de avaliar
    buscar_novos : bool = True
    reviews_por_local : int = Field(default=20, ge=1, le=100)
