"""HTTP-level tests for the FastAPI routes.

External dependencies are swapped through `app.dependency_overrides`, so the
routes run for real while Firebase, Apify and OpenAI stay out of the picture.
"""
import pytest
from fastapi.testclient import TestClient

import main
from tests.fakes import FakeAIAnalyzer, FakeAlertRepository, FakeReviewProvider, FakeSpotReviewRepository, make_review

CITY_PAYLOAD = {
    "place_id": "city-1",
    "city_name": "Test City",
    "spot_info": [{"place_id": "spot-a", "name": "Beach"}, {"place_id": "spot-b", "name": "Museum"}],
}
RULES_PAYLOAD = {"spots": [{"place_id": "spot-1", "name": "Beach"}], "buscar_novos": False}


class FakeCityAnalysisService:
    def __init__(self, status: str):
        self.status = status
        self.heavy_calls = []

    async def request_deep_analysis(self, place_id, force_refresh=False):
        return {"status": self.status, "message": "test"}

    async def execute_heavy_analysis(self, place_id, city_name, spot_ids, spot_info):
        self.heavy_calls.append({"place_id": place_id, "spot_ids": spot_ids})


@pytest.fixture
def client():
    yield TestClient(main.app)
    main.app.dependency_overrides.clear()


def override(dependency, value):
    main.app.dependency_overrides[dependency] = lambda: value


class TestAnalyzeCity:

    def test_started_analysis_runs_in_the_background_with_the_spot_ids(self, client):
        service = FakeCityAnalysisService(status="started")
        override(main.get_city_analysis_service, service)

        response = client.post("/api/analyze-city", json=CITY_PAYLOAD)

        assert response.status_code == 200
        assert response.json()["status"] == "started"
        assert service.heavy_calls == [{"place_id": "city-1", "spot_ids": ["spot-a", "spot-b"]}]

    @pytest.mark.parametrize("status", ["cached", "processing"])
    def test_cached_or_running_analysis_is_not_scheduled_again(self, client, status):
        service = FakeCityAnalysisService(status=status)
        override(main.get_city_analysis_service, service)

        response = client.post("/api/analyze-city", json=CITY_PAYLOAD)

        assert response.json()["status"] == status
        assert service.heavy_calls == []

    def test_request_without_city_is_rejected(self, client):
        override(main.get_city_analysis_service, FakeCityAnalysisService(status="started"))

        response = client.post("/api/analyze-city", json={"city_name": "Missing id"})

        assert response.status_code == 422

    @pytest.mark.xfail(strict=True, reason="Known security issue: /api/analyze-city has no authentication and spends Apify/OpenAI credits.")
    def test_requires_authentication(self, client):
        override(main.get_city_analysis_service, FakeCityAnalysisService(status="started"))

        response = client.post("/api/analyze-city", json=CITY_PAYLOAD)

        assert response.status_code == 401


class TestSpotReviews:

    def setup_providers(self, repo, ai=None):
        provider = FakeReviewProvider([make_review("r1", place_id="spot-1")])
        override(main.get_review_repositorie, repo)
        override(main.get_reviews_adapter, provider)
        override(main.get_open_ai_adapter, ai or FakeAIAnalyzer())
        return provider

    def test_cached_analysis_is_returned_without_scraping(self, client):
        cached = {"id": "spot-1", "total": 3, "resumo": "cached"}
        provider = self.setup_providers(FakeSpotReviewRepository(cached=cached))

        response = client.get("/api/spots/spot-1/reviews")

        assert response.json() == cached
        assert provider.fetch_calls == []

    def test_new_analysis_is_saved_with_its_alerts(self, client):
        repo = FakeSpotReviewRepository()
        alerts = [{"review_id": "r1", "tipo_perigo": "FURTO", "justificativa": "stolen"}]
        ai = FakeAIAnalyzer(analyses_by_spot={"spot-1": {
            "danger_score": 40.0, "score_absoluto": 20, "resumo": "Theft", "alertas": alerts, "total_reviews": 1,
        }})
        self.setup_providers(repo, ai)

        response = client.get("/api/spots/spot-1/reviews")

        assert response.status_code == 200
        assert response.json()["resumo"] == "Theft"
        assert repo.saved_data[0]["id"] == "spot-1"
        assert repo.saved_alerts == [alerts]

    @pytest.mark.xfail(strict=True, reason="Known bug: the route reads 'perigo_score', but the analyzer returns 'danger_score'.")
    def test_response_carries_the_danger_score_from_the_ai(self, client):
        ai = FakeAIAnalyzer(analyses_by_spot={"spot-1": {
            "danger_score": 40.0, "score_absoluto": 20, "resumo": "", "alertas": [], "total_reviews": 1,
        }})
        self.setup_providers(FakeSpotReviewRepository(), ai)

        response = client.get("/api/spots/spot-1/reviews")

        assert response.json()["perigo_score"] == 40.0


class TestRunAlertRules:

    def test_requires_authentication(self, client):
        response = client.post("/api/alert-rules/run", json=RULES_PAYLOAD)

        assert response.status_code == 401

    def test_authenticated_request_returns_the_run_id_and_processes_it(self, client):
        repo = FakeAlertRepository(rules=[])
        override(main.get_current_uid, "secretary-1")
        override(main.get_alert_repository, repo)
        override(main.get_reviews_adapter, FakeReviewProvider())
        override(main.get_open_ai_adapter, FakeAIAnalyzer())

        response = client.post("/api/alert-rules/run", json=RULES_PAYLOAD)

        assert response.status_code == 202
        run_id = response.json()["run_id"]
        assert repo.runs[run_id]["owner_uid"] == "secretary-1"
        assert repo.runs[run_id]["status"] == "concluido"

    def test_request_without_spots_is_rejected(self, client):
        override(main.get_current_uid, "secretary-1")
        override(main.get_alert_repository, FakeAlertRepository())
        override(main.get_reviews_adapter, FakeReviewProvider())
        override(main.get_open_ai_adapter, FakeAIAnalyzer())

        response = client.post("/api/alert-rules/run", json={"spots": []})

        assert response.status_code == 422
