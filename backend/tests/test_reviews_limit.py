"""Tests for the per-place reviews limit applied to every Apify request."""
import pytest

from adapters.reviews import apify
from config import limits


@pytest.fixture
def max_reviews(monkeypatch):
    def set_limit(value):
        monkeypatch.setattr(limits, "MAX_REVIEWS_PER_PLACE", value)
    return set_limit


def test_requests_above_the_limit_are_capped(max_reviews):
    max_reviews(30)

    assert apify.limit_reviews_per_place(50) == 30


def test_requests_below_the_limit_are_kept(max_reviews):
    max_reviews(30)

    assert apify.limit_reviews_per_place(20) == 20


def test_the_limit_is_used_when_nothing_is_requested(max_reviews):
    max_reviews(30)

    assert apify.with_reviews_limit({"placeIds": ["a"]}, None)["maxReviews"] == 30


def test_removing_the_limit_keeps_what_the_caller_asked(max_reviews):
    max_reviews(None)

    assert apify.limit_reviews_per_place(50) == 50


def test_without_any_limit_max_reviews_is_not_sent_to_apify(max_reviews):
    max_reviews(None)

    assert "maxReviews" not in apify.with_reviews_limit({"placeIds": ["a"]}, None)
