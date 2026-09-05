"""Provider directory. Serializer NEVER includes contact fields — by contract."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.db.session import get_session
from app.integrations.maps import HaversineAdapter
from app.repositories import booking_repository as bookings
from app.repositories import provider_repository as repo
from app.schemas.provider import (
    OfferingOut,
    ProviderDetailOut,
    ProviderOut,
    ReviewOut,
    ServiceOut,
)

router = APIRouter(prefix="/providers", tags=["providers"])
maps = HaversineAdapter()


def to_out(p, *, from_geo: tuple[float, float] | None = None) -> ProviderOut:
    return ProviderOut(
        id=p.id,
        display_name=p.display_name,
        title=p.title,
        qualifications=p.qualifications,
        languages=p.languages,
        city=p.city,
        lat=p.lat,
        lng=p.lng,
        coverage_km=p.coverage_km,
        bio=p.bio,
        years_exp=p.years_exp,
        rating_avg=p.rating_avg,
        rating_count=p.rating_count,
        verification_status=p.verification_status.value
        if hasattr(p.verification_status, "value")
        else p.verification_status,
        photo_color=p.photo_color,
        distance_km=round(maps.distance_km(from_geo, (p.lat, p.lng)), 1) if from_geo else None,
    )


@router.get("", response_model=list[ProviderOut])
async def list_providers(
    city: str | None = Query(None),
    q: str | None = Query(None),
    lat: float | None = Query(None),
    lng: float | None = Query(None),
    session: AsyncSession = Depends(get_session),
):
    geo = (lat, lng) if lat is not None and lng is not None else None
    return [to_out(p, from_geo=geo) for p in await repo.list_providers(session, city=city, q=q)]


@router.get("/{provider_id}", response_model=ProviderDetailOut)
async def provider_detail(provider_id: int, session: AsyncSession = Depends(get_session)):
    p = await repo.get_provider(session, provider_id)
    if p is None:
        raise NotFoundError("Provider not found")
    offerings = await repo.list_offerings(session, provider_id)
    reviews = await bookings.list_provider_reviews(session, provider_id)

    offering_out = []
    for o in offerings:
        service = await repo.get_service(session, o.service_id)
        if service:
            offering_out.append(
                OfferingOut(service=ServiceOut.model_validate(service), price_inr=o.price_inr)
            )
    return ProviderDetailOut(
        **to_out(p).model_dump(),
        offerings=offering_out,
        reviews=[
            ReviewOut(
                id=r.id,
                rating=r.rating,
                text=r.text,
                author_label=f"Family #{r.patient_id:04d}",  # masked identity
                created_at=r.created_at,
            )
            for r in reviews
        ],
    )
