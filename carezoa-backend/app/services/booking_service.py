"""Booking engine — the ONLY module allowed to call the booking state machine."""

from __future__ import annotations

import random
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, GuardFailedError, InvalidTransitionError, NotFoundError
from app.models.booking import Booking, ServiceReport
from app.models.support import AuditLog
from app.repositories import booking_repository as bookings
from app.repositories import engagement_repository as engagement
from app.repositories import provider_repository as providers
from app.schemas.booking import BookingCreateIn
from app.state_machines.booking_state_machine import (
    ActorRole,
    BookingStatus,
    Event,
    GuardFailed,
    PaymentStatus,
    TransitionContext,
    TransitionError,
    assert_transition,
)

TIMELINE = [
    ("scheduled", "Visit scheduled", "created_at"),
    ("confirmed", "Booking confirmed", "confirmed_at"),
    ("en_route", "Provider en route", "en_route_at"),
    ("checked_in", "Checked in", "checked_in_at"),
    ("in_service", "Service in progress", "started_at"),
    ("completed", "Visit completed", "completed_at"),
]


def _roles(role) -> ActorRole:
    return ActorRole(role) if role in [a.value for a in ActorRole] else ActorRole.PATIENT


async def create_booking(
    session: AsyncSession, *, patient_id: int, payload: BookingCreateIn
) -> Booking:
    offering = await providers.get_offering(session, payload.provider_id, payload.service_id)
    if offering is None:
        raise NotFoundError("Provider does not offer this service")
    service = await providers.get_service(session, payload.service_id)
    if service is None:
        raise NotFoundError("Service not found")

    booking = await bookings.create_booking(
        session,
        Booking(
            patient_id=patient_id,
            provider_id=payload.provider_id,
            service_id=payload.service_id,
            family_member_id=payload.family_member_id,
            status=BookingStatus.PENDING_PAYMENT,
            payment_status=PaymentStatus.UNPAID,
            starts_at=payload.starts_at,
            duration_min=service.duration_min,
            patient_snapshot=payload.patient.model_dump(),
            address=payload.address,
            city=payload.city,
            instructions=payload.instructions,
            amount_inr=offering.price_inr,
        ),
    )
    await engagement.add_audit(
        session,
        AuditLog(
            actor_user_id=None,
            actor_role="patient",
            entity_type="booking",
            entity_id=booking.id,
            action="booking.created",
            to_state=booking.status.value,
            meta={"amount_inr": booking.amount_inr, "provider_id": booking.provider_id},
        ),
    )
    return booking


async def apply_event(
    session: AsyncSession,
    *,
    booking_id: int,
    event: Event,
    actor_user_id: int | None,
    actor_role: str,
    expected_otp: str | None = None,
    provided_otp: str | None = None,
    new_start: datetime | None = None,
    resolution: str | None = None,
) -> tuple[Booking, tuple[str, ...]]:
    booking = await bookings.get_booking_for_update(session, booking_id)
    if booking is None:
        raise NotFoundError("Booking not found")

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    hours_until_start = (booking.starts_at.replace(tzinfo=None) - now).total_seconds() / 3600
    ctx = TransitionContext(
        actor_role=_roles(actor_role),
        hours_until_start=hours_until_start,
        expected_otp=expected_otp if expected_otp is not None else booking.checkin_otp,
        provided_otp=provided_otp,
        resolution=resolution,
    )

    from_status = booking.status
    try:
        plan = assert_transition(from_status, event, ctx)
    except TransitionError as e:
        raise InvalidTransitionError(str(e))
    except GuardFailed as e:
        raise GuardFailedError(e.reason)

    # apply
    booking.status = plan.to_status
    booking.version += 1
    if plan.stamp_field:
        setattr(booking, plan.stamp_field, now)
    if event == Event.RESCHEDULE and new_start is not None:
        booking.starts_at = new_start
    for effect in plan.effects:
        if effect == "issue_checkin_otp":
            booking.checkin_otp = f"{random.randint(1000, 9999)}"
        if effect == "initiate_refund_if_paid" and booking.payment_status == PaymentStatus.PAID:
            booking.payment_status = PaymentStatus.REFUNDED

    await bookings.save_booking(session, booking)
    await engagement.add_audit(
        session,
        AuditLog(
            actor_user_id=actor_user_id,
            actor_role=actor_role,
            entity_type="booking",
            entity_id=booking.id,
            action=event.value,
            from_state=from_status.value,
            to_state=plan.to_status.value,
            meta={"effects": list(plan.effects)},
        ),
    )
    return booking, plan.effects


def serialize_timeline(booking: Booking) -> list[dict]:
    return [
        {"key": key, "label": label, "at": getattr(booking, attr, None)}
        for key, label, attr in TIMELINE
    ]


async def submit_service_report(
    session: AsyncSession,
    *,
    booking_id: int,
    provider_id: int,
    summary: str,
    vitals: dict,
    notes: str,
) -> ServiceReport:
    booking = await bookings.get_booking(session, booking_id)
    if booking is None:
        raise NotFoundError("Booking not found")
    if booking.provider_id != provider_id:
        raise ConflictError("Report must be submitted by the assigned provider")
    if booking.status != BookingStatus.COMPLETED:
        raise GuardFailedError("Reports can only be submitted for completed visits")
    existing = await bookings.get_report_for_booking(session, booking_id)
    if existing is not None:
        raise ConflictError("Report already submitted")

    report = await bookings.add_service_report(
        session,
        ServiceReport(booking_id=booking_id, summary=summary, vitals=vitals, notes=notes),
    )

    # ANTI-BYPASS: REPORT_SUBMITTED → PAYOUT_READY is the ONLY payout trigger.
    fee = int(booking.amount_inr * 0.15)
    payout = await engagement.get_payout_for_booking(session, booking_id)
    if payout is None:
        from app.models.payment import Payout, PayoutStatus

        await engagement.add_payout(
            session,
            Payout(
                provider_id=booking.provider_id,
                booking_id=booking.id,
                amount_inr=booking.amount_inr - fee,
                platform_fee_inr=fee,
                status=PayoutStatus.READY,
                ready_at=datetime.utcnow(),
            ),
        )
    await engagement.add_audit(
        session,
        AuditLog(
            actor_user_id=None,
            actor_role="provider",
            entity_type="booking",
            entity_id=booking_id,
            action="report_submitted",
            meta={"payout_status": "payout_ready"},
        ),
    )
    return report
