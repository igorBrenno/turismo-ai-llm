"""Unit tests for CityDeepAnalysis (the city-wide deep analysis flow)."""
from datetime import datetime, timedelta, timezone

import pytest

from services.deep_analysis_services import CityDeepAnalysis
from tests.fakes import FakeAIAnalyzer, FakeDeepAnalysisRepository, FakeReviewProvider, make_review

CITY_ID = "city-1"


def build_service(repo=None, provider=None, ai=None) -> CityDeepAnalysis:
    return CityDeepAnalysis(
        db_repo=repo or FakeDeepAnalysisRepository(),
        apify_adapter=provider or FakeReviewProvider(),
        google_adapter=None,
        llm_adapter=ai or FakeAIAnalyzer(),
    )


def analyzed_hours_ago(hours: float) -> dict:
    return {"analysis_status": "idle", "last_analyzed": datetime.now(timezone.utc) - timedelta(hours=hours)}


class TestRequestDeepAnalysis:

    async def test_city_never_analyzed_starts_processing(self):
        repo = FakeDeepAnalysisRepository(city_data=None)

        result = await build_service(repo).request_deep_analysis(CITY_ID)

        assert result["status"] == "started"
        assert repo.status_updates == ["processing"]

    async def test_city_already_processing_is_not_started_again(self):
        repo = FakeDeepAnalysisRepository(city_data={"analysis_status": "processing"})

        result = await build_service(repo).request_deep_analysis(CITY_ID, force_refresh=True)

        assert result["status"] == "processing"
        assert repo.status_updates == []

    async def test_analysis_from_less_than_24_hours_ago_is_served_from_cache(self):
        repo = FakeDeepAnalysisRepository(city_data=analyzed_hours_ago(2))

        result = await build_service(repo).request_deep_analysis(CITY_ID)

        assert result["status"] == "cached"
        assert repo.status_updates == []

    async def test_analysis_older_than_24_hours_is_refreshed(self):
        repo = FakeDeepAnalysisRepository(city_data=analyzed_hours_ago(30))

        result = await build_service(repo).request_deep_analysis(CITY_ID)

        assert result["status"] == "started"

    async def test_force_refresh_bypasses_a_recent_cache(self):
        repo = FakeDeepAnalysisRepository(city_data=analyzed_hours_ago(2))

        result = await build_service(repo).request_deep_analysis(CITY_ID, force_refresh=True)

        assert result["status"] == "started"
        assert repo.status_updates == ["processing"]


class TestExecuteHeavyAnalysis:

    @pytest.fixture
    def spots(self):
        return [
            {"place_id": "spot-a", "name": "Beach", "lat": -7.1, "lng": -34.8, "rating": 4.5},
            {"place_id": "spot-b", "name": "Museum", "lat": -7.2, "lng": -34.9, "rating": 4.8},
        ]

    @pytest.fixture
    def provider(self):
        return FakeReviewProvider([
            make_review("a1", place_id="spot-a"),
            make_review("a2", place_id="spot-a"),
            make_review("b1", place_id="spot-b"),
        ])

    @pytest.fixture
    def ai(self):
        return FakeAIAnalyzer(analyses_by_spot={
            "spot-a": {
                "danger_score": 40.0, "score_absoluto": 20, "resumo": "Robbery reports", "total_reviews": 2,
                "alertas": [{"review_id": "a1", "tipo_perigo": "CRIME_GRAVE", "justificativa": "robbed", "danger_points_added": 20}],
            },
        })

    async def run(self, repo, provider, ai, spots):
        service = build_service(repo, provider, ai)
        await service.execute_heavy_analysis(CITY_ID, "Test City", [s["place_id"] for s in spots], spots)

    async def test_each_spot_is_analyzed_separately(self, provider, ai, spots):
        await self.run(FakeDeepAnalysisRepository(), provider, ai, spots)

        analyzed = sorted([r.review_id for r in batch] for batch in ai.analyzed_batches)
        assert analyzed == [["a1", "a2"], ["b1"]]

    async def test_ai_scores_are_saved_on_the_matching_spot(self, provider, ai, spots):
        repo = FakeDeepAnalysisRepository()

        await self.run(repo, provider, ai, spots)

        saved_spots = {s["place_id"]: s for s in repo.saved_spots_and_reviews[0]["spot_info"]}
        assert saved_spots["spot-a"]["danger_score"] == 40.0
        assert saved_spots["spot-a"]["resumo_ia"] == "Robbery reports"
        assert saved_spots["spot-b"]["danger_score"] == 0

    async def test_all_scraped_reviews_are_persisted(self, provider, ai, spots):
        repo = FakeDeepAnalysisRepository()

        await self.run(repo, provider, ai, spots)

        assert len(repo.saved_spots_and_reviews[0]["reviews"]) == 3
        assert repo.saved_city_data[0]["total_analisado"] == 3

    async def test_alerts_are_tagged_with_the_spot_that_produced_them(self, provider, ai, spots):
        repo = FakeDeepAnalysisRepository()

        await self.run(repo, provider, ai, spots)

        alerts = repo.saved_alerts[0]["alerts"]
        assert [(a["review_id"], a["place_id"]) for a in alerts] == [("a1", "spot-a")]

    async def test_status_returns_to_idle_when_finished(self, provider, ai, spots):
        repo = FakeDeepAnalysisRepository()

        await self.run(repo, provider, ai, spots)

        assert repo.last_status == "idle"

    async def test_no_alerts_are_saved_when_the_ai_finds_none(self, provider, spots):
        repo = FakeDeepAnalysisRepository()

        await self.run(repo, provider, FakeAIAnalyzer(), spots)

        assert repo.saved_alerts == []

    async def test_failure_during_analysis_sets_status_to_error(self, provider, spots):
        repo = FakeDeepAnalysisRepository()

        await self.run(repo, provider, FakeAIAnalyzer(analysis_error=RuntimeError("OpenAI down")), spots)

        assert repo.last_status == "error"
        assert repo.saved_spots_and_reviews == []

    @pytest.mark.xfail(strict=True, reason="Known bug: calls the non-existent update_deep_analysis_status, so the city ends in 'error'.")
    async def test_no_reviews_found_returns_status_to_idle(self, spots):
        repo = FakeDeepAnalysisRepository()

        await self.run(repo, FakeReviewProvider([]), FakeAIAnalyzer(), spots)

        assert repo.last_status == "idle"
