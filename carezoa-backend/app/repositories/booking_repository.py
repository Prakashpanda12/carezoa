"""Data access for bookings, service reports, ratings/reviews."""

from __future__ import annotations

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.booking import Booking, Review, ServiceReport
from app.state_machines.booking_state_machine import BookingStatus


async def create_booking(session: AsyncSession, booking: Booking) -> Booking:
    session.add(booking)
    await session.flush()
    return booking


async def get_booking(session: AsyncSession, booking_id: int) -> Booking | None:
    return await session.get(Booking, booking_id)


async def get_booking_for_update(session: AsyncSession, booking_id: int) -> Booking | None:
    res = await session.execute(
        select(Booking).where(Booking.id == booking_id).with_for_update()
    )
    return res.scalar_one_or_none()


async def list_patient_bookings(
    session: AsyncSession, patient_id: int, *, scope: str = "all"
) -> list[Booking]:
    stmt = select(Booking).where(Booking.patient_id == patient_id)
    if scope == "upcoming":
        stmt = stmt.where(
            Booking.status.in_(
                [
                    BookingStatus.PENDING_PAYMENT,
                    BookingStatus.CONFIRMED,
                    BookingStatus.EN_ROUTE,
                    BookingStatus.CHECKED_IN,
                    BookingStatus.IN_SERVICE,
                ]
            )
        )
    elif scope == "past":
        stmt = stmt.where(
            Booking.status.in_(
                [
                    BookingStatus.COMPLETED,
                    BookingStatus.CANCELLED,
                    BookingStatus.NO_SHOW,
                    BookingStatus.DISPUTED,
                ]
            )
        )
    res = await session.execute(stmt.order_by(desc(Booking.starts_at)))
    return list(res.scalars())


async def list_provider_bookings(session: AsyncSession, provider_id: int) -> list[Booking]:
    res = await session.execute(
        select(Booking).where(Booking.provider_id == provider_id).order_by(desc(Booking.starts_at))
    )
    return list(res.scalars())


async def save_booking(session: AsyncSession, booking: Booking) -> Booking:
    session.add(booking)
    await session.flush()
    return booking


async def add_service_report(session: AsyncSession, report: ServiceReport) -> ServiceReport:
    session.add(report)
    await session.flush()
    return report


async def get_report_for_booking(session: AsyncSession, booking_id: int) -> ServiceReport | None:
    res = await session.execute(
        select(ServiceReport).where(ServiceReport.booking_id == booking_id)
    )
    return res.scalar_one_or_none()


async def list_reports(session: AsyncSession) -> list[ServiceReport]:
    res = await session.execute(select(ServiceReport).order_by(desc(ServiceReport.id)))
    return list(res.scalars())


async def add_review(session: AsyncSession, review: Review) -> Review:
    session.add(review)
    await session.flush()
    return review


async def list_provider_reviews(session: AsyncSession, provider_id: int) -> list[Review]:
    res = await session.execute(
        select(Review).where(Review.provider_id == provider_id).order_by(desc(Review.id)).limit(20)
    )
    return list(res.scalars())
