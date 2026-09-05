"""Search + matching. Built on the explicit scoring function in matching_service."""

from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.integrations.maps import HaversineAdapter
from app.repositories import provider_repository as repo
from app.schemas.provider import RankedProviderOut
from app.services.matching_service import ProviderCandidate, rank
from app.api.v1.routers.providers import to_out

router = APIRouter(prefix="/search", tags=["search"])
maps = HaversineAdapter()


@router.get("/providers", response_model=list[RankedProviderOut])
async def search_providers(
    service_id: int,
    lat: float | None = Query(None),
    lng: float | None = Query(None),
    when: datetime | None = Query(None),
    session: AsyncSession = Depends(get_session),
):
    when = when or datetime.utcnow()
    geo = (lat, lng) if lat is not None and lng is not None else None
    providers = await repo.list_providers(session)

    candidates: list[ProviderCandidate] = []
    by_id = {}
    for p in providers:
        offering = await repo.get_offering(session, p.id, service_id)
        windows = await repo.list_availability(session, p.id)
        available = (
            any(w.weekday == when.weekday() and w.start_min <= when.hour * 60 <= w.end_min for w in windows)
            if windows
            else True  # no availability rows configured → treated as open
        )
        distance = maps.distance_km(geo, (p.lat, p.lng)) if geo else None
        candidates.append(
            ProviderCandidate(
                provider_id=p.id,
                offers_service=offering is not None,
                verification_status=p.verification_status.value
                if hasattr(p.verification_status, "value")
                else p.verification_status,
                is_available=available,
                distance_km=distance,
                coverage_km=p.coverage_km,
                rating_avg=p.rating_avg,
                rating_count=p.rating_count,
                years_exp=p.years_exp,
                acceptance_rate=p.acceptance_rate,
                cancellation_rate=p.cancellation_rate,
                price_inr=offering.price_inr if offering else 0,
                next_available_hours=24.0,
            )
        )
        by_id[p.id] = p

    ranked = rank(candidates, service_id=service_id)
    return [
        RankedProviderOut(
            provider=to_out(by_id[s.provider_id], from_geo=geo),
            score=s.total,
            reasons=s.parts,
        )
        for s in ranked
    ]
