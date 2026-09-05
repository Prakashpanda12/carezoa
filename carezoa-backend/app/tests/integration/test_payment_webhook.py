"""Payment webhook: signature verification, idempotency, booking state effects."""

import json
from datetime import datetime, timedelta

import pytest

from app.models.booking import Booking
from app.models.catalog import Service
from app.models.patient import PatientProfile
from app.models.payment import GatewayPaymentStatus, Payment
from app.models.provider import Provider, VerificationStatus
from app.models.user import User
from app.core.security import Role
from app.state_machines.booking_state_machine import BookingStatus, PaymentStatus
from app.tests.conftest import sign

pytestmark = pytest.mark.asyncio

BASE = "/api/v1"


async def login(client, phone: str) -> str:
    res = await client.post(f"{BASE}/auth/otp/request", json={"phone": phone})
    verify = await client.post(
        f"{BASE}/auth/otp/verify", json={"phone": phone.replace(" ", ""), "code": res.json()["dev_code"]}
    )
    return verify.json()["access_token"]


async def test_webhook_rejects_bad_signature(client):
    payload = {"payment_id": 1, "result": "success", "event_ref": "evt_1"}
    res = await client.post(
        f"{BASE}/payments/webhook",
        content=json.dumps(payload).encode(),
        headers={"X-Carezoa-Signature": "deadbeef", "Content-Type": "application/json"},
    )
    assert res.status_code == 401


async def test_webhook_success_confirms_booking_and_is_idempotent(client, session_factory):
    # arrange: provider, service, booking (pending_payment), payment intent — direct in DB
    token = await login(client, "+919437000099")

    async with session_factory() as s:
        puser = User(phone="+919447000099", role=Role.PROVIDER)
        s.add(puser)
        await s.flush()
        provider = Provider(
            user_id=puser.id, display_name="Test Nurse", title="RN", city="BBSR",
            lat=20.35, lng=85.82, verification_status=VerificationStatus.VERIFIED,
        )
        service = Service(category="Nursing", name="Nurse Visit", duration_min=60, base_price_inr=799)
        s.add_all([provider, service])
        await s.flush()
        patient_user = (await s.execute(__import__("sqlalchemy").select(User).where(User.phone == "+919437000099"))).scalar_one()
        profile = PatientProfile(user_id=patient_user.id, name="Test Patient")
        s.add(profile)
        await s.flush()
        booking = Booking(
            patient_id=profile.id,
            provider_id=provider.id,
            service_id=service.id,
            status=BookingStatus.PENDING_PAYMENT,
            payment_status=PaymentStatus.UNPAID,
            starts_at=datetime.utcnow() + timedelta(days=1),
            patient_snapshot={"name": "Test Patient", "age": 70, "gender": "M"},
            address="Address line 1, Patia",
            city="Bhubaneswar",
            amount_inr=799,
        )
        payment = Payment(booking_id=0, amount_inr=799, status=GatewayPaymentStatus.PENDING)
        s.add(booking)
        await s.flush()
        payment.booking_id = booking.id
        s.add(payment)
        await s.commit()
        booking_id, payment_id = booking.id, payment.id

    # act: signed webhook → success
    payload = {"payment_id": payment_id, "result": "success", "event_ref": "evt_confirm_1"}
    raw, signature = sign(payload)
    first = await client.post(
        f"{BASE}/payments/webhook", content=raw, headers={"X-Carezoa-Signature": signature}
    )
    assert first.status_code == 200
    assert first.json() == {"received": True, "event_ref": "processed"}

    # idempotent: same event_ref replays as duplicate
    again = await client.post(
        f"{BASE}/payments/webhook", content=raw, headers={"X-Carezoa-Signature": signature}
    )
    assert again.json()["event_ref"] == "duplicate_ignored"

    # state effect: booking is confirmed now
    async with session_factory() as s:
        fresh = await s.get(Booking, booking_id)
        assert fresh.status == BookingStatus.CONFIRMED
        assert fresh.payment_status == PaymentStatus.PAID
        assert fresh.confirmed_at is not None

    _ = token
