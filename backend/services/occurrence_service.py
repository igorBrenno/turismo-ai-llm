from typing import Any, Dict

from config.auth import CurrentUser
from models.occurrence import CreateOccurrenceRequest
from repositories.base import OccurrenceRepository

# Ocorrências registradas por pessoas não alteram o danger_score do spot
HUMAN_REPORT_DANGER_POINTS = 0


def build_occurrence(request : CreateOccurrenceRequest, reporter : CurrentUser) -> Dict[str, Any]:
    return {
        "place_id" : request.place_id,
        "spot_nome" : request.spot_nome,
        "tipo_perigo" : request.tipo_perigo,
        "justificativa" : request.descricao.strip(),
        "resolvida" : False,
        "reporter" : "ocorrencia",
        "reporter_email" : reporter.email,
        "reporter_uid" : reporter.uid,
        "danger_points_added" : HUMAN_REPORT_DANGER_POINTS,
    }


async def register_occurrence(request : CreateOccurrenceRequest, reporter : CurrentUser, repo : OccurrenceRepository) -> str:
    return await repo.save_occurrence(request.city_place_id, build_occurrence(request, reporter))
