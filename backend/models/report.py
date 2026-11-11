from datetime import date, datetime, timedelta, timezone
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

TipoPerigo = Literal["CRIME_GRAVE", "GOLPE", "FURTO", "INFRAESTRUTURA_PERIGOSA", "OUTRO"]


class UserReportCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    place_id: str = Field(min_length=1, max_length=300)
    place_name: str = Field(min_length=1, max_length=200)
    place_address: Optional[str] = Field(default=None, max_length=500)
    tipo_perigo: TipoPerigo
    justificativa: str = Field(min_length=10, max_length=2000)
    data_ocorrencia: date
    rating: Optional[int] = Field(default=None, ge=1, le=5)

    @field_validator("data_ocorrencia")
    @classmethod
    def validar_data(cls, value: date) -> date:
        # Um dia de tolerância porque o usuário pode estar em outro fuso horário.
        if value > datetime.now(timezone.utc).date() + timedelta(days=1):
            raise ValueError("A data da ocorrência não pode estar no futuro.")
        return value


class UserReportPublic(BaseModel):
    """Dados expostos no dashboard. Não inclui uid nem autor da denúncia."""

    id: str
    place_id: str
    place_name: str
    tipo_perigo: TipoPerigo
    justificativa: str
    data_ocorrencia: date
    status: str
    criado_em: datetime
