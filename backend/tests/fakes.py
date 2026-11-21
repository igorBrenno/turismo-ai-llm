from typing import Any, Dict, List, Optional, Set

from adapters.ai.base import AIAnalizerProviderAdapter
from adapters.reviews.base import ReviewProviderAdapter
from models.review import ReviewSchema
from repositories.base import AlertRepository


def make_review(review_id: str, place_id: str = "spot-1", text: str = "Nice place", rating: float = 5.0) -> ReviewSchema:
    return ReviewSchema(review_id=review_id, author="Tester", rating=rating, text=text, place_id=place_id)


class FakeReviewProvider(ReviewProviderAdapter):
    

    def __init__(self, reviews: Optional[List[ReviewSchema]] = None):
        self.reviews = reviews or []
        self.fetch_calls: List[Dict[str, Any]] = []

    def fetch_reviews(self, place_id, limit) -> List[ReviewSchema]:
        self.fetch_calls.append({"place_id": place_id, "limit": limit})
        place_ids = place_id if isinstance(place_id, list) else [place_id]
        return [r for r in self.reviews if r.place_id in place_ids]


class FakeAIAnalyzer(AIAnalizerProviderAdapter):
    """Configurable stand-in for the LLM.

    - `analyses_by_spot`: result returned by `analizar_reviews`, keyed by the reviews' place_id.
    - `rule_matches`: review ids that match any rule in `avaliar_regra`.
    - `fail_on_calls`: 1-based call numbers of `avaliar_regra` that raise an error.
    """

    def __init__(self, analyses_by_spot=None, rule_matches=None, fail_on_calls=None, analysis_error=None):
        self.analyses_by_spot: Dict[str, Dict[str, Any]] = analyses_by_spot or {}
        self.rule_matches: Set[str] = set(rule_matches or [])
        self.fail_on_calls: Set[int] = set(fail_on_calls or [])
        self.analysis_error: Optional[Exception] = analysis_error
        self.analyzed_batches: List[List[ReviewSchema]] = []
        self.rule_batches: List[Dict[str, Any]] = []

    def analizar_reviews(self, reviews):
        if self.analysis_error:
            raise self.analysis_error
        self.analyzed_batches.append(reviews)
        place_id = reviews[0].place_id if reviews else None
        return self.analyses_by_spot.get(place_id, {
            "danger_score": 0, "score_absoluto": 0, "resumo": "", "alertas": [], "total_reviews": len(reviews),
        })

    def avaliar_regra(self, criterio, reviews):
        self.rule_batches.append({"criterio": criterio, "review_ids": [r.review_id for r in reviews]})
        if len(self.rule_batches) in self.fail_on_calls:
            raise RuntimeError("simulated AI failure")
        return [
            {"review_id": r.review_id, "casa": r.review_id in self.rule_matches, "trecho": r.text if r.review_id in self.rule_matches else ""}
            for r in reviews
        ]


class FakeDeepAnalysisRepository:
    """Implements the subset of FirebaseReviewRepository used by CityDeepAnalysis."""

    def __init__(self, city_data: Optional[Dict[str, Any]] = None):
        self.city_data = city_data
        self.status_updates: List[str] = []
        self.saved_spots_and_reviews: List[Dict[str, Any]] = []
        self.saved_city_data: List[Dict[str, Any]] = []
        self.saved_alerts: List[Dict[str, Any]] = []

    async def get_deep_analysis(self, place_id):
        return self.city_data

    async def update_deep_analysis(self, place_id, status):
        self.status_updates.append(status)

    async def save_spots_and_reviews(self, city_place_id, reviews, spot_info):
        self.saved_spots_and_reviews.append({"city_place_id": city_place_id, "reviews": reviews, "spot_info": spot_info})

    async def save_data_deep_analysis(self, place_id, data):
        self.saved_city_data.append(data)

    async def save_alerts_deep_analysis(self, place_id, alerts):
        self.saved_alerts.append({"place_id": place_id, "alerts": alerts})

    @property
    def last_status(self) -> Optional[str]:
        return self.status_updates[-1] if self.status_updates else None


class FakeSpotReviewRepository:
    """Implements the subset of FirebaseReviewRepository used by the single-spot route."""

    def __init__(self, cached: Optional[Dict[str, Any]] = None):
        self.cached = cached
        self.saved_data: List[Dict[str, Any]] = []
        self.saved_alerts: List[Any] = []

    async def get_analysis(self, place_id):
        return self.cached

    async def save_data(self, place_id, data):
        self.saved_data.append(data)

    async def save_alerts(self, place_id, alerts):
        self.saved_alerts.append(alerts)


class FakeAlertRepository(AlertRepository):
    """In-memory AlertRepository that tracks the run document like Firestore would."""

    def __init__(self, rules=None, stored_reviews=None, checked=None, rules_error=None):
        self.rules: List[Dict[str, Any]] = rules or []
        self.stored_reviews: Dict[str, List[ReviewSchema]] = stored_reviews or {}
        self.checked: Dict[str, Set[str]] = checked or {}
        self.rules_error: Optional[Exception] = rules_error
        self.runs: Dict[str, Dict[str, Any]] = {}
        self.saved_results: List[Dict[str, Any]] = []

    async def get_active_rules(self, uid):
        if self.rules_error:
            raise self.rules_error
        return self.rules

    async def save_reviews(self, place_id, reviews):
        existing = {r.review_id: r for r in self.stored_reviews.get(place_id, [])}
        existing.update({r.review_id: r for r in reviews})
        self.stored_reviews[place_id] = list(existing.values())

    async def get_reviews(self, place_id):
        return list(self.stored_reviews.get(place_id, []))

    async def get_checked_review_ids(self, rule_id, criterio):
        return set(self.checked.get(rule_id, set()))

    async def save_rule_results(self, uid, rule, resultados, reviews_by_id, place_by_review, place_names):
        self.saved_results.append({"rule_id": rule["id"], "resultados": resultados})
        return sum(1 for r in resultados if r["casa"])

    async def create_run(self, uid, total_locais):
        run_id = f"run-{len(self.runs) + 1}"
        self.runs[run_id] = {"owner_uid": uid, "total_locais": total_locais, "status": "iniciando"}
        return run_id

    async def update_run(self, run_id, data):
        self.runs.setdefault(run_id, {}).update(data)


class FakeOccurrenceRepository:
    """Records occurrences instead of writing them to Firestore."""

    def __init__(self):
        self.saved: List[Dict[str, Any]] = []

    async def save_occurrence(self, city_place_id, data):
        self.saved.append({"city_place_id": city_place_id, "data": data})
        return f"occurrence-{len(self.saved)}"
