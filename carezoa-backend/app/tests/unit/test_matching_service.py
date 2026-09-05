"""Matching algorithm: hard gates + weighted ranking (never price-only sorts)."""

import unittest

from app.services.matching_service import ProviderCandidate, passes_gates, rank, score_provider


def make(provider_id: int, **kw) -> ProviderCandidate:
    base = dict(
        provider_id=provider_id,
        offers_service=True,
        verification_status="verified",
        is_available=True,
        distance_km=3.0,
        coverage_km=15.0,
        rating_avg=4.6,
        rating_count=40,
        years_exp=6,
        acceptance_rate=0.9,
        cancellation_rate=0.05,
        price_inr=799,
        next_available_hours=12,
    )
    base.update(kw)
    return ProviderCandidate(**base)


class Gates(unittest.TestCase):
    def test_unverified_excluded(self):
        ok, why = passes_gates(make(1, verification_status="pending_review"), 3)
        self.assertFalse(ok)
        self.assertEqual(why, "verification")

    def test_service_ineligible_excluded(self):
        ok, why = passes_gates(make(1, offers_service=False), 3)
        self.assertFalse(ok)
        self.assertEqual(why, "service")

    def test_out_of_coverage_excluded(self):
        ok, why = passes_gates(make(1, distance_km=30.0, coverage_km=15.0), 3)
        self.assertFalse(ok)
        self.assertEqual(why, "coverage")

    def test_unavailable_excluded(self):
        ok, _ = passes_gates(make(1, is_available=False), 3)
        self.assertFalse(ok)


class Ranking(unittest.TestCase):
    def test_better_nearby_provider_wins(self):
        near = make(1, distance_km=2.0, rating_avg=4.9, rating_count=120)
        far = make(2, distance_km=13.0, rating_avg=4.3, rating_count=10)
        [first, second] = rank([far, near], service_id=3)
        self.assertEqual(first.provider_id, 1)
        self.assertGreater(first.total, second.total)

    def test_cheap_but_far_and_risky_never_beats_near_and_reliable(self):
        # Anti "sort by price": price weight is only 0.06.
        cheap_risky = make(
            1, distance_km=14.0, price_inr=499, acceptance_rate=0.6, cancellation_rate=0.3,
            rating_avg=4.0, rating_count=5,
        )
        pricier_reliable = make(
            2, distance_km=2.5, price_inr=999, acceptance_rate=0.98, cancellation_rate=0.01,
            rating_avg=4.8, rating_count=80,
        )
        ranked = rank([cheap_risky, pricier_reliable], service_id=3)
        self.assertEqual(ranked[0].provider_id, 2)

    def test_cancellation_history_hurts(self):
        flaky = make(1, cancellation_rate=0.4)
        steady = make(2, cancellation_rate=0.02)
        ranked = rank([flaky, steady], service_id=3)
        self.assertEqual(ranked[0].provider_id, 2)

    def test_breakdown_parts_exist(self):
        score = score_provider(make(1), price_span=(499, 999))
        for key in ("distance", "rating", "reliability", "price", "experience"):
            self.assertIn(key, score.parts)
        self.assertGreaterEqual(score.total, 0.0)
        self.assertLessEqual(score.total, 1.0)

    def test_empty_when_no_eligible(self):
        self.assertEqual(rank([make(1, verification_status="suspended")], service_id=3), [])


if __name__ == "__main__":
    unittest.main()
