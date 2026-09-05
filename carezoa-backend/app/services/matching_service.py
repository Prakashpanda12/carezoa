"""
Matching algorithm (MVP) — explicit, testable weighted scoring.

Hard gates first (service eligibility, verification, coverage, availability),
then a weighted soft score. Price weight is deliberately the smallest: we NEVER
sort by price alone.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field

WEIGHTS = {
    "distance": 0.24,
    "rating": 0.20,
    "reliability": 0.14,  # acceptance + low cancellation
    "cancellation": 0.14,  # applies as (1 - cancellation_rate)
    "experience": 0.12,
    "availability_recency": 0.10,
    "price": 0.06,
}
assert abs(sum(WEIGHTS.values()) - 1.0) < 1e-9, "weights must sum to 1"


@dataclass(frozen=True)
class ProviderCandidate:
    provider_id: int
    offers_service: bool
    verification_status: str  # "verified" gate
    is_available: bool  # computed from availability rows for the requested slot
    distance_km: float | None
    coverage_km: float
    rating_avg: float  # 0..5
    rating_count: int
    years_exp: int
    acceptance_rate: float  # 0..1
    cancellation_rate: float  # 0..1
    price_inr: int
    next_available_hours: float  # from now


@dataclass(frozen=True)
class ScoreBreakdown:
    provider_id: int
    total: float
    parts: dict[str, float] = field(default_factory=dict)


def _distance_score(distance_km: float | None, coverage_km: float) -> float:
    if distance_km is None:
        return 0.5  # unknown location → neutral
    # exponential decay that reaches ~0.08 at the coverage limit
    return math.exp(-distance_km / max(coverage_km * 0.45, 1.0))


def _rating_score(avg: float, count: int) -> float:
    quality = max(avg, 0.0) / 5.0
    volume = math.log1p(min(count, 100)) / math.log1p(100)
    return quality * (0.5 + 0.5 * volume)


def _experience_score(years: int) -> float:
    return min(years, 15) / 15


def _recency_score(hours: float) -> float:
    return math.exp(-max(hours, 0.0) / 48.0)


def passes_gates(c: ProviderCandidate, service_id: int | None = None) -> tuple[bool, str]:
    if service_id is not None and not c.offers_service:
        return False, "service"
    if c.verification_status != "verified":
        return False, "verification"
    if not c.is_available:
        return False, "availability"
    if c.distance_km is not None and c.distance_km > c.coverage_km:
        return False, "coverage"
    return True, ""


def score_provider(
    c: ProviderCandidate, *, price_span: tuple[int, int]
) -> ScoreBreakdown:
    """Score 0..1. `price_span` = (min, max) price across the whole candidate set."""
    lo, hi = price_span
    if hi > lo:
        price_score = 1.0 - (c.price_inr - lo) / (hi - lo)
    else:
        price_score = 0.5
    parts = {
        "distance": _distance_score(c.distance_km, c.coverage_km),
        "rating": _rating_score(c.rating_avg, c.rating_count),
        "reliability": c.acceptance_rate,
        "cancellation": 1.0 - c.cancellation_rate,
        "experience": _experience_score(c.years_exp),
        "availability_recency": _recency_score(c.next_available_hours),
        "price": price_score,
    }
    total = sum(WEIGHTS[k] * v for k, v in parts.items())
    return ScoreBreakdown(provider_id=c.provider_id, total=round(total, 6), parts=parts)


def rank(
    candidates: list[ProviderCandidate], *, service_id: int
) -> list[ScoreBreakdown]:
    """Hard-gate, normalize price across survivors, then rank by weighted score."""
    eligible = [c for c in candidates if passes_gates(c, service_id)[0]]
    if not eligible:
        return []
    prices = [c.price_inr for c in eligible]
    span = (min(prices), max(prices))
    ranked = [score_provider(c, price_span=span) for c in eligible]
    ranked.sort(key=lambda s: s.total, reverse=True)
    return ranked
