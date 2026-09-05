"""Booking endpoints — thin layer over booking_service (owns the state machine)."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user, require_role
from app.api.v1.routers.providers import to_out
from app.core.exceptions import NotFoundError, PermissionDeniedError
from app.core.security import Role
from app.db.session import get_session
from app.models.user import User
from app.repositories import booking_repository as repo
from app.repositories import identity_repository as identity
from app.repositories import provider_repository as providers
from app.schemas.booking import (
    BookingCreateIn,
    BookingOut,
    IncidentReportIn,
    OtpVerifyVisitIn,
    RescheduleIn,
    ServiceReportIn,
)
from app.schemas.provider import ServiceOut
from app.services import booking_service
from app.state_machines.booking_state_machine import BookingStatus, Event

router = APIRouter(prefix="/bookings", tags=["bookings"])


async def booking_out(session: AsyncSession, booking, *, include_otp: bool) -> BookingOut:
    provider = await providers.get_provider(session, booking.provider_id)
    service = await providers.get_service(session, booking.service_id)
    return BookingOut(
        id=booking.id,
        status=booking.status.value if hasattr(booking.status, "value") else booking.status,
        payment_status=booking.payment_status.value
        if hasattr(booking.payment_status, "value")
        else booking.payment_status,
        starts_at=booking.starts_at,
        duration_min=booking.duration_min,
        patient=booking.patient_snapshot,
        address=booking.address,
        city=booking.city,
        instructions=booking.instructions,
        amount_inr=booking.amount_inr,
        currency=booking.currency,
        checkin_otp=booking.checkin_otp if include_otp and booking.en_route_at else None,
        provider_id=booking.provider_id,
        service_id=booking.service_id,
        timeline=booking_service.serialize_timeline(booking),
        provider=to_out(provider) if provider else None,
        service=ServiceOut.model_validate(service) if service else None,
        created_at=booking.created_at,
    )


async def _patient_id(session: AsyncSession, user: User) -> int:
    profile = await identity.get_patient_by_user(session, user.id)
    if profile is None:
        raise NotFoundError("Patient profile not found")
    return profile.id


@router.post("", response_model=BookingOut, status_code=201)
async def create(
    payload: BookingCreateIn,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    if payload.starts_at < datetime.now(timezone.utc):
        raise PermissionDeniedError("Cannot book in the past")
    patient_id = await _patient_id(session, user)
    booking = await booking_service.create_booking(
        session, patient_id=patient_id, payload=payload
    )
    await session.commit()
    return await booking_out(session, booking, include_otp=True)


@router.get("", response_model=list[BookingOut])
async def list_mine(
    scope: str = Query("all", pattern="^(upcoming|past|all)$"),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    patient_id = await _patient_id(session, user)
    rows = await repo.list_patient_bookings(session, patient_id, scope=scope)
    return [await booking_out(session, b, include_otp=True) for b in rows]


@router.get("/{booking_id}", response_model=BookingOut)
async def get_one(
    booking_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    booking = await repo.get_booking(session, booking_id)
    if booking is None:
        raise NotFoundError("Booking not found")
    is_provider_side = user.role == Role.PROVIDER
    return await booking_out(session, booking, include_otp=not is_provider_side)


@router.post("/{booking_id}/reschedule", response_model=BookingOut)
async def reschedule(
    booking_id: int,
    payload: RescheduleIn,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    booking, _ = await booking_service.apply_event(
        session,
        booking_id=booking_id,
        event=Event.RESCHEDULE,
        actor_user_id=user.id,
        actor_role=user.role.value,
        new_start=payload.starts_at,
    )
    await session.commit()
    return await booking_out(session, booking, include_otp=True)


@router.post("/{booking_id}/cancel", response_model=BookingOut)
async def cancel(
    booking_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    booking, _ = await booking_service.apply_event(
        session,
        booking_id=booking_id,
        event=Event.CANCEL,
        actor_user_id=user.id,
        actor_role=user.role.value,
    )
    await session.commit()
    return await booking_out(session, booking, include_otp=True)


def _provider_event(event: Event):
    async def handler(
        booking_id: int,
        user: User = Depends(require_role(Role.PROVIDER)),
        session: AsyncSession = Depends(get_session),
    ):
        booking, _ = await booking_service.apply_event(
            session,
            booking_id=booking_id,
            event=event,
            actor_user_id=user.id,
            actor_role=user.role.value,
        )
        await session.commit()
        return await booking_out(session, booking, include_otp=False)

    return handler


router.post("/{booking_id}/provider-departed", response_model=BookingOut)(
    _provider_event(Event.PROVIDER_DEPARTED)
)
router.post("/{booking_id}/start", response_model=BookingOut)(
    _provider_event(Event.SERVICE_STARTED)
)
router.post("/{booking_id}/complete", response_model=BookingOut)(
    _provider_event(Event.SERVICE_COMPLETED)
)
router.post("/{booking_id}/no-show", response_model=BookingOut)(
    _provider_event(Event.PROVIDER_NO_SHOW)
)


@router.post("/{booking_id}/verify-otp", response_model=BookingOut)
async def verify_otp(
    booking_id: int,
    payload: OtpVerifyVisitIn,
    user: User = Depends(require_role(Role.PROVIDER)),
    session: AsyncSession = Depends(get_session),
):
    booking, _ = await booking_service.apply_event(
        session,
        booking_id=booking_id,
        event=Event.OTP_VERIFIED,
        actor_user_id=user.id,
        actor_role=user.role.value,
        provided_otp=payload.code,
    )
    await session.commit()
    return await booking_out(session, booking, include_otp=False)


@router.post("/{booking_id}/incident", status_code=201)
async def raise_incident(
    booking_id: int,
    payload: IncidentReportIn,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    from app.models.support import Incident
    from app.repositories import engagement_repository as engagement

    incident = await engagement.add_incident(
        session,
        Incident(
            booking_id=booking_id,
            reporter_user_id=user.id,
            type=payload.type,
            description=payload.description,
        ),
    )
    await booking_service.apply_event(
        session,
        booking_id=booking_id,
        event=Event.INCIDENT_RAISED,
        actor_user_id=user.id,
        actor_role=user.role.value,
    )
    await session.commit()
    return {"incident_id": incident.id, "status": incident.status.value}


@router.post("/{booking_id}/report", status_code=201)
async def submit_report(
    booking_id: int,
    payload: ServiceReportIn,
    user: User = Depends(require_role(Role.PROVIDER)),
    session: AsyncSession = Depends(get_session),
):
    provider = await providers.get_provider_for_user(session, user.id)
    if provider is None:
        raise NotFoundError("Provider profile not found")
    report = await booking_service.submit_service_report(
        session,
        booking_id=booking_id,
        provider_id=provider.id,
        summary=payload.summary,
        vitals=payload.vitals,
        notes=payload.notes,
    )
    await session.commit()
    return {"report_id": report.id, "payout_status": "payout_ready"}
