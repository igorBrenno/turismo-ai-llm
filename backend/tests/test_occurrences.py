"""Tests for occurrences registered by people (not by the AI)."""
import pytest
from fastapi.testclient import TestClient

import main
from config.auth import CurrentUser
from models.occurrence import CreateOccurrenceRequest
from services.occurrence_service import build_occurrence
from tests.fakes import FakeOccurrenceRepository

REPORTER = CurrentUser(uid="secretary-1", email="secretary@city.gov")
PAYLOAD = {
    "city_place_id": "city-1",
    "place_id": "spot-a",
    "spot_nome": "Beach",
    "tipo_perigo": "FURTO",
    "descricao": "  Phone stolen near the kiosk  ",
}


class TestBuildOccurrence:

    def test_identifies_the_human_reporter(self):
        occurrence = build_occurrence(CreateOccurrenceRequest(**PAYLOAD), REPORTER)

        assert occurrence["reporter"] == "ocorrencia"
        assert occurrence["reporter_uid"] == "secretary-1"
        assert occurrence["reporter_email"] == "secretary@city.gov"

    def test_does_not_add_danger_points(self):
        occurrence = build_occurrence(CreateOccurrenceRequest(**PAYLOAD), REPORTER)

        assert occurrence["danger_points_added"] == 0

    def test_is_stored_like_an_ai_alert_so_the_dashboard_can_show_it(self):
        occurrence = build_occurrence(CreateOccurrenceRequest(**PAYLOAD), REPORTER)

        assert occurrence["place_id"] == "spot-a"
        assert occurrence["tipo_perigo"] == "FURTO"
        assert occurrence["justificativa"] == "Phone stolen near the kiosk"
        assert occurrence["resolvida"] is False


class TestCreateOccurrenceRoute:

    @pytest.fixture
    def client(self):
        yield TestClient(main.app)
        main.app.dependency_overrides.clear()

    @pytest.fixture
    def repo(self):
        repo = FakeOccurrenceRepository()
        main.app.dependency_overrides[main.get_occurrence_repository] = lambda: repo
        return repo

    @pytest.fixture
    def signed_in(self):
        main.app.dependency_overrides[main.get_current_user] = lambda: REPORTER

    def test_requires_authentication(self, client, repo):
        response = client.post("/api/occurrences", json=PAYLOAD)

        assert response.status_code == 401
        assert repo.saved == []

    def test_saves_the_occurrence_in_the_chosen_city(self, client, repo, signed_in):
        response = client.post("/api/occurrences", json=PAYLOAD)

        assert response.status_code == 201
        assert response.json() == {"id": "occurrence-1"}
        assert repo.saved[0]["city_place_id"] == "city-1"
        assert repo.saved[0]["data"]["reporter_uid"] == "secretary-1"

    def test_reporter_comes_from_the_token_not_from_the_request_body(self, client, repo, signed_in):
        client.post("/api/occurrences", json={**PAYLOAD, "reporter_uid": "someone-else", "reporter_email": "fake@x.com"})

        saved = repo.saved[0]["data"]
        assert saved["reporter_uid"] == "secretary-1"
        assert saved["reporter_email"] == "secretary@city.gov"

    def test_unknown_danger_type_is_rejected(self, client, repo, signed_in):
        response = client.post("/api/occurrences", json={**PAYLOAD, "tipo_perigo": "ALIENS"})

        assert response.status_code == 422
        assert repo.saved == []

    @pytest.mark.parametrize("field", ["city_place_id", "place_id", "descricao"])
    def test_required_fields_are_validated(self, client, repo, signed_in, field):
        response = client.post("/api/occurrences", json={**PAYLOAD, field: ""})

        assert response.status_code == 422
