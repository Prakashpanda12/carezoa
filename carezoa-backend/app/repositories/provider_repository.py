"""Data access for services catalogue, providers, offerings, availability, credentials."""

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.catalog import Service
from app.models.provider import (
    Provider,
    ProviderAvailability,
    ProviderCredential,
    ProviderServiceOffering,
)


async def list_services(session: AsyncSession) -> list[Service]:
    res = await session.execute(select(Service).where(Service.active.is_(True)).order_by(Service.id))
    return list(res.scalars())


async def get_service(session: AsyncSession, service_id: int) -> Service | None:
    return await session.get(Service, service_id)


async def list_providers(
    session: AsyncSession, *, city: str | None = None, q: str | None = None
) -> list[Provider]:
    stmt = select(Provider)
    if city:
        stmt = stmt.where(func.lower(Provider.city) == city.lower())
    if q:
        like = f"%{q.lower()}%"
        stmt = stmt.where(func.lower(Provider.display_name + " " + Provider.title).like(like))
    res = await session.execute(stmt.order_by(Provider.rating_avg.desc()))
    return list(res.scalars())


async def get_provider(session: AsyncSession, provider_id: int) -> Provider | None:
    return await session.get(Provider, provider_id)


async def get_provider_for_user(session: AsyncSession, user_id: int) -> Provider | None:
    res = await session.execute(select(Provider).where(Provider.user_id == user_id))
    return res.scalar_one_or_none()


async def list_offerings(session: AsyncSession, provider_id: int) -> list[ProviderServiceOffering]:
    res = await session.execute(
        select(ProviderServiceOffering).where(
            ProviderServiceOffering.provider_id == provider_id,
            ProviderServiceOffering.active.is_(True),
        )
    )
    return list(res.scalars())


async def get_offering(
    session: AsyncSession, provider_id: int, service_id: int
) -> ProviderServiceOffering | None:
    res = await session.execute(
        select(ProviderServiceOffering).where(
            ProviderServiceOffering.provider_id == provider_id,
            ProviderServiceOffering.service_id == service_id,
            ProviderServiceOffering.active.is_(True),
        )
    )
    return res.scalar_one_or_none()


async def list_availability(session: AsyncSession, provider_id: int) -> list[ProviderAvailability]:
    res = await session.execute(
        select(ProviderAvailability).where(ProviderAvailability.provider_id == provider_id)
    )
    return list(res.scalars())


async def replace_availability(
    session: AsyncSession, provider_id: int, windows: list[dict]
) -> None:
    await session.execute(
        ProviderAvailability.__table__.delete().where(
            ProviderAvailability.provider_id == provider_id
        )
    )
    for w in windows:
        session.add(ProviderAvailability(provider_id=provider_id, **w))
    await session.flush()


async def add_credential(session: AsyncSession, credential: ProviderCredential) -> ProviderCredential:
    session.add(credential)
    await session.flush()
    return credential


async def list_credentials(session: AsyncSession, provider_id: int) -> list[ProviderCredential]:
    res = await session.execute(
        select(ProviderCredential).where(ProviderCredential.provider_id == provider_id)
    )
    return list(res.scalars())
