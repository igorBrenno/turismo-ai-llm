from typing import Literal
from pydantic import BaseModel, Field

# Mesmos tipos usados pela IA, para os gráficos por categoria continuarem funcionando
DangerType = Literal["CRIME_GRAVE", "FURTO", "GOLPE", "INFRAESTRUTURA_PERIGOSA", "OUTRO"]


class CreateOccurrenceRequest(BaseModel):
    city_place_id : str = Field(min_length=1)
    place_id : str = Field(min_length=1)
    spot_nome : str = ""
    tipo_perigo : DangerType
    descricao : str = Field(min_length=3, max_length=500)
