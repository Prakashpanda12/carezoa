"""Payments: intents, hosted checkout refs, and signature-verified, idempotent webhooks."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, UnauthorizedError
from app.models.payment import GatewayPaymentStatus, Payment, PaymentEvent
from app.services import booking_service
from app.repositories import booking_repository as bookings
from app.repositories import engagement_repository as engagement
from app.state_machines.booking_state_machine import (
    Event as BookingEvent,
    PaymentStatus as BookingPaymentStatus,
)


async def create_intent(session: AsyncSession, *, booking_id: int, method_id: int | None) -> Payment:
    booking = await bookings.get_booking(session, booking_id)
    if booking is None:
        raise NotFoundError("Booking not found")
    payment = await engagement.add_payment(
        session, Payment(booking_id=booking_id, method_id=method_id, amount_inr=booking.amount_inr)
    )
    payment.gateway_ref = f"sandbox_order_{payment.id}_{datetime.utcnow().timestamp():.0f}"
    await session.flush()
    return payment


async def handle_webhook(
    session: AsyncSession,
    *,
    gateway,
    payload_bytes: bytes,
    signature: str | None,
    payload: dict,
) -> tuple[bool, str]:
    """Verify signature → dedupe → apply booking event. Idempotent by event_ref."""
    if not gateway.verify_signature(payload_bytes, signature or ""):
        raise UnauthorizedError("Bad webhook signature")

    event_ref = str(payload.get("event_ref", ""))
    if not event_ref:
        return False, "missing event_ref"

    existing = (
        await session.execute(select(PaymentEvent).where(PaymentEvent.event_ref == event_ref))
    ).scalar_one_or_none()
    if existing is not None:
        return True, "duplicate_ignored"

    payment_id = int(payload["payment_id"])
    payment = await engagement.get_payment(session, payment_id)
    if payment is None:
        raise NotFoundError("Unknown payment")

    result = str(payload.get("result"))
    event_kind = "payment.succeeded" if result == "success" else "payment.failed"
    session.add(
        PaymentEvent(
            payment_id=payment_id, event_ref=event_ref, type=event_kind, payload=payload
        )
    )

    payment.status = (
        GatewayPaymentStatus.SUCCESS if result == "success" else GatewayPaymentStatus.FAILED
    )
    booking_event = (
        BookingEvent.PAYMENT_SUCCEEDED if result == "success" else BookingEvent.PAYMENT_FAILED
    )
    booking = await bookings.get_booking(session, payment.booking_id)
    if booking is not None:
        if result == "success" and booking.payment_status != BookingPaymentStatus.REFUNDED:
            booking.payment_status = BookingPaymentStatus.PAID
        await booking_service.apply_event(
            session,
            booking_id=payment.booking_id,
            event=booking_event,
            actor_user_id=None,
            actor_role="system",
        )
    return True, "processed"
