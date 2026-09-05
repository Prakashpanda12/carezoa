from __future__ import annotations

from datetime import datetime
from enum import StrEnum

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class GatewayPaymentStatus(StrEnum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"
    REFUNDED = "refunded"


class PayoutStatus(StrEnum):
    READY = "payout_ready"  # REPORT_SUBMITTED → PAYOUT_READY (the ONLY trigger)
    PROCESSING = "processing"
    PAID = "paid"
    ON_HOLD = "on_hold"


class PaymentMethod(TimestampMixin, Base):
    __tablename__ = "payment_methods"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(sa.ForeignKey("users.id"), index=True)
    type: Mapped[str] = mapped_column(sa.String(16))  # card | upi
    label: Mapped[str] = mapped_column(sa.String(60))
    detail: Mapped[str] = mapped_column(sa.String(80))  # masked only — never PAN/CVV
    provider_ref: Mapped[str | None] = mapped_column(sa.String(120))  # gateway token


class Payment(TimestampMixin, Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(primary_key=True)
    booking_id: Mapped[int] = mapped_column(sa.ForeignKey("bookings.id"), index=True)
    method_id: Mapped[int | None] = mapped_column(sa.ForeignKey("payment_methods.id"))
    gateway: Mapped[str] = mapped_column(sa.String(32), default="sandbox")
    gateway_ref: Mapped[str | None] = mapped_column(sa.String(120), index=True)
    amount_inr: Mapped[int] = mapped_column(sa.Integer)
    currency: Mapped[str] = mapped_column(sa.String(3), default="INR")
    status: Mapped[GatewayPaymentStatus] = mapped_column(
        sa.Enum(GatewayPaymentStatus, name="gateway_payment_status", native_enum=False, length=16),
        default=GatewayPaymentStatus.PENDING,
        nullable=False,
    )


class PaymentEvent(TimestampMixin, Base):
    """Append-only webhook/PSP event log (idempotent consumption keyed on event_ref)."""

    __tablename__ = "payment_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    payment_id: Mapped[int] = mapped_column(sa.ForeignKey("payments.id"), index=True)
    event_ref: Mapped[str] = mapped_column(sa.String(120), unique=True)
    type: Mapped[str] = mapped_column(sa.String(60))
    payload: Mapped[dict] = mapped_column(JSONB, default=dict)
    processed: Mapped[bool] = mapped_column(sa.Boolean, default=False)


class Payout(TimestampMixin, Base):
    __tablename__ = "payouts"

    id: Mapped[int] = mapped_column(primary_key=True)
    provider_id: Mapped[int] = mapped_column(sa.ForeignKey("providers.id"), index=True)
    booking_id: Mapped[int] = mapped_column(sa.ForeignKey("bookings.id"), unique=True)
    amount_inr: Mapped[int] = mapped_column(sa.Integer)
    platform_fee_inr: Mapped[int] = mapped_column(sa.Integer, default=0)
    status: Mapped[PayoutStatus] = mapped_column(
        sa.Enum(PayoutStatus, name="payout_status", native_enum=False, length=16),
        default=PayoutStatus.READY,
        nullable=False,
    )
    ready_at: Mapped[datetime | None] = mapped_column(sa.DateTime(timezone=True))
    paid_at: Mapped[datetime | None] = mapped_column(sa.DateTime(timezone=True))
    transfer_ref: Mapped[str | None] = mapped_column(sa.String(120))
