"""Unit tests for OpenAIAdapter.

The OpenAI client is replaced by a mock, so these tests check what *our* code
does with the model's answer (scoring, batching, id mapping), not the model itself.
"""
import json
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from adapters.ai.open_ai import OpenAIAdapter
from tests.fakes import make_review


def ai_response(payload: dict, finish_reason: str = "stop"):
    message = SimpleNamespace(content=json.dumps(payload))
    return SimpleNamespace(choices=[SimpleNamespace(message=message, finish_reason=finish_reason)])


def danger_payload(*alerts, summary="Summary"):
    return {"resumo": summary, "alertas": list(alerts)}


def alert(review_id, danger_type):
    return {"review_id": review_id, "tipo_perigo": danger_type, "justificativa": "excerpt"}


@pytest.fixture
def adapter():
    instance = OpenAIAdapter(open_ai_token="test-token")
    instance.client = MagicMock()
    return instance


def reply_with(adapter, *responses):
    adapter.client.chat.completions.create.side_effect = list(responses)


def sent_payload(adapter, call_index=0):
    messages = adapter.client.chat.completions.create.call_args_list[call_index].kwargs["messages"]
    return json.loads(messages[-1]["content"])


class TestAnalyzeReviews:

    def test_each_alert_records_the_points_of_its_danger_type(self, adapter):
        reply_with(adapter, ai_response(danger_payload(alert("r1", "CRIME_GRAVE"), alert("r2", "GOLPE"))))

        result = adapter.analizar_reviews([make_review("r1"), make_review("r2")])

        assert [a["danger_points_added"] for a in result["alertas"]] == [20, 15]

    def test_absolute_score_is_the_sum_of_alert_points(self, adapter):
        reply_with(adapter, ai_response(danger_payload(
            alert("r1", "FURTO"), alert("r2", "INFRAESTRUTURA_PERIGOSA"), alert("r3", "OUTRO"),
        )))

        result = adapter.analizar_reviews([make_review(f"r{i}") for i in range(1, 4)])

        assert result["score_absoluto"] == 20 + 8 + 5

    def test_danger_score_is_points_per_review_as_a_percentage(self, adapter):
        reply_with(adapter, ai_response(danger_payload(alert("r1", "OUTRO"))))

        result = adapter.analizar_reviews([make_review(f"r{i}") for i in range(10)])

        assert result["danger_score"] == pytest.approx(5 / 10 * 100)
        assert result["total_reviews"] == 10

    def test_unknown_danger_type_adds_one_point(self, adapter):
        reply_with(adapter, ai_response(danger_payload(alert("r1", "SOMETHING_NEW"))))

        result = adapter.analizar_reviews([make_review("r1")])

        assert result["alertas"][0]["danger_points_added"] == 1
        assert result["score_absoluto"] == 1

    def test_no_alerts_means_zero_danger(self, adapter):
        reply_with(adapter, ai_response(danger_payload()))

        result = adapter.analizar_reviews([make_review("r1")])

        assert result["danger_score"] == 0
        assert result["alertas"] == []

    def test_empty_review_list_returns_zero_without_calling_the_ai(self, adapter):
        result = adapter.analizar_reviews([])

        assert result["danger_score"] == 0
        assert result["total_reviews"] == 0
        adapter.client.chat.completions.create.assert_not_called()

    def test_reviews_without_text_are_not_sent_to_the_ai(self, adapter):
        reply_with(adapter, ai_response(danger_payload()))

        adapter.analizar_reviews([make_review("r1", text="Great view"), make_review("r2", text="")])

        assert [item["id"] for item in sent_payload(adapter)] == ["r1"]

    def test_reviews_are_sent_in_batches_of_fifty(self, adapter):
        reply_with(adapter, *[ai_response(danger_payload()) for _ in range(3)])

        adapter.analizar_reviews([make_review(f"r{i}") for i in range(120)])

        batch_sizes = [len(sent_payload(adapter, i)) for i in range(3)]
        assert batch_sizes == [50, 50, 20]

    def test_batch_summaries_are_joined_and_alerts_are_merged(self, adapter):
        reply_with(
            adapter,
            ai_response(danger_payload(alert("r0", "GOLPE"), summary="First")),
            ai_response(danger_payload(alert("r60", "FURTO"), summary="Second")),
        )

        result = adapter.analizar_reviews([make_review(f"r{i}") for i in range(60)])

        assert result["resumo"] == "First | Second"
        assert [a["review_id"] for a in result["alertas"]] == ["r0", "r60"]

    @pytest.mark.xfail(strict=True, reason="Known issue: danger_score is not bounded and can exceed 100.")
    def test_danger_score_never_exceeds_one_hundred(self, adapter):
        reply_with(adapter, ai_response(danger_payload(alert("r1", "CRIME_GRAVE"), alert("r2", "CRIME_GRAVE"))))

        result = adapter.analizar_reviews([make_review("r1"), make_review("r2")])

        assert 0 <= result["danger_score"] <= 100


class TestEvaluateRule:

    def rule_answer(self, *results, finish_reason="stop"):
        return ai_response({"resultados": list(results)}, finish_reason=finish_reason)

    def test_short_ids_are_mapped_back_to_review_ids(self, adapter):
        reply_with(adapter, self.rule_answer(
            {"id": "1", "casa": True, "trecho": "no ramp"},
            {"id": "2", "casa": False, "trecho": ""},
        ))

        results = adapter.avaliar_regra("accessibility issues", [make_review("google-abc"), make_review("google-xyz")])

        assert results == [
            {"review_id": "google-abc", "casa": True, "trecho": "no ramp"},
            {"review_id": "google-xyz", "casa": False, "trecho": ""},
        ]

    def test_the_ai_receives_short_ids_instead_of_google_ids(self, adapter):
        reply_with(adapter, self.rule_answer())

        adapter.avaliar_regra("noise", [make_review("very-long-google-id", text="Too loud")])

        assert sent_payload(adapter) == [{"id": "1", "texto": "Too loud"}]

    def test_ids_invented_by_the_ai_are_discarded(self, adapter):
        reply_with(adapter, self.rule_answer(
            {"id": "1", "casa": True, "trecho": "dirty"},
            {"id": "99", "casa": True, "trecho": "hallucinated"},
        ))

        results = adapter.avaliar_regra("cleanliness", [make_review("r1")])

        assert [r["review_id"] for r in results] == ["r1"]

    def test_truncated_answer_splits_the_batch_and_retries(self, adapter):
        reply_with(
            adapter,
            self.rule_answer(finish_reason="length"),
            self.rule_answer({"id": "1", "casa": True, "trecho": "a"}),
            self.rule_answer({"id": "1", "casa": False, "trecho": ""}),
        )

        results = adapter.avaliar_regra("criterion", [make_review("r1"), make_review("r2")])

        assert adapter.client.chat.completions.create.call_count == 3
        assert [r["review_id"] for r in results] == ["r1", "r2"]

    def test_single_review_that_still_truncates_is_skipped(self, adapter):
        reply_with(adapter, self.rule_answer(finish_reason="length"))

        results = adapter.avaliar_regra("criterion", [make_review("r1")])

        assert results == []

    def test_reviews_without_text_are_not_evaluated(self, adapter):
        results = adapter.avaliar_regra("criterion", [make_review("r1", text="")])

        assert results == []
        adapter.client.chat.completions.create.assert_not_called()
