"""Payments: intent creation + signature-verified webhook ingestion."""

from fastapi import APIRouter, Depends, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user
from app.core.config import get_settings
from app.db.session import get_session
from app.integrations.payment_gateway import get_gateway
from app.repositories import booking_repository as bookings
from app.schemas.booking import PaymentIntentOut, WebhookOut
from app.services import payment_service
from app.core.exceptions import NotFoundError, PermissionDeniedError
from app.models.user import User

router = APIRouter(prefix="/payments", tags=["payments"])
settings = get_settings()
gateway = get_gateway(settings.payment_gateway, settings.payment_webhook_secret)


@router.post("/intent", response_model=PaymentIntentOut, status_code=201)
async def intent(
    payload: dict,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    booking_id = int(payload["booking_id"])
    booking = await bookings.get_booking(session, booking_id)
    if booking is None:
        raise NotFoundError("Booking not found")
    if booking.payment_status.value == "paid":
        raise PermissionDeniedError("Already paid")
    payment = await payment_service.create_intent(
        session, booking_id=booking_id, method_id=payload.get("method_id")
    )
    await session.commit()
    checkout_url = gateway.checkout_url(checkout_ref=payment.gateway_ref or "")
    return PaymentIntentOut(
        payment_id=payment.id,
        booking_id=booking_id,
        amount_inr=payment.amount_inr,
        currency=payment.currency,
        checkout_ref=payment.gateway_ref or "",
        checkout_url=checkout_url,
    )


@router.post("/webhook", response_model=WebhookOut)
async def webhook(
    request: Request,
    x_carezoa_signature: str | None = Header(None),
    session: AsyncSession = Depends(get_session),
):
    raw = await request.body()
    import json

    payload = json.loads(raw.decode() or "{}")
    received, ref = await payment_service.handle_webhook(
        session,
        gateway=gateway,
        payload_bytes=raw,
        signature=x_carezoa_signature,
        payload=payload,
    )
    await session.commit()
    return WebhookOut(received=received, event_ref=ref)
