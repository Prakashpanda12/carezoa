from __future__ import annotations

from datetime import datetime
from enum import StrEnum  # noqa: F401  (kept for enum column typing)

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

# Canonical enums live in the pure state machine (single source of truth).
from app.state_machines.booking_state_machine import BookingStatus, PaymentStatus  # noqa: F401
from app.db.base import Base, TimestampMixin


class Booking(TimestampMixin, Base):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(sa.ForeignKey("patient_profiles.id"), index=True)
    provider_id: Mapped[int] = mapped_column(sa.ForeignKey("providers.id"), index=True)
    service_id: Mapped[int] = mapped_column(sa.ForeignKey("services.id"))
    family_member_id: Mapped[int | None] = mapped_column(sa.ForeignKey("family_members.id"))

    status: Mapped[BookingStatus] = mapped_column(
        sa.Enum(BookingStatus, name="booking_status", native_enum=False, length=24),
        default=BookingStatus.PENDING_PAYMENT,
        nullable=False,
        index=True,
    )
    payment_status: Mapped[PaymentStatus] = mapped_column(
        sa.Enum(PaymentStatus, name="payment_status", native_enum=False, length=16),
        default=PaymentStatus.UNPAID,
        nullable=False,
    )

    starts_at: Mapped[datetime] = mapped_column(sa.DateTime(timezone=True), index=True)
    duration_min: Mapped[int] = mapped_column(sa.Integer, default=60)
    patient_snapshot: Mapped[dict] = mapped_column(JSONB, default=dict)  # {name, age, gender}
    address: Mapped[str] = mapped_column(sa.String(320))
    city: Mapped[str] = mapped_column(sa.String(80))
    instructions: Mapped[str] = mapped_column(sa.Text, default="")
    amount_inr: Mapped[int] = mapped_column(sa.Integer)
    currency: Mapped[str] = mapped_column(sa.String(3), default="INR")

    # Family-side only; never serialized to the provider counterparty.
    checkin_otp: Mapped[str | None] = mapped_column(sa.String(6))
    cancel_reason: Mapped[str | None] = mapped_column(sa.String(240))

    confirmed_at: Mapped[datetime | None] = mapped_column(sa.DateTime(timezone=True))
    en_route_at: Mapped[datetime | None] = mapped_column(sa.DateTime(timezone=True))
    checked_in_at: Mapped[datetime | None] = mapped_column(sa.DateTime(timezone=True))
    started_at: Mapped[datetime | None] = mapped_column(sa.DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(sa.DateTime(timezone=True))

    version: Mapped[int] = mapped_column(sa.Integer, default=1)  # optimistic locking

    __table_args__ = (
        sa.CheckConstraint("duration_min > 0", name="bookings_duration_pos"),
        sa.CheckConstraint("amount_inr >= 0", name="bookings_amount_pos"),
    )


class OtpChallenge(TimestampMixin, Base):
    __tablename__ = "otp_challenges"

    id: Mapped[int] = mapped_column(primary_key=True)
    phone: Mapped[str] = mapped_column(sa.String(20), index=True)
    code_hash: Mapped[str] = mapped_column(sa.String(64))
    expires_at: Mapped[datetime] = mapped_column(sa.DateTime(timezone=True))
    attempts: Mapped[int] = mapped_column(sa.Integer, default=0)
    consumed: Mapped[bool] = mapped_column(sa.Boolean, default=False)


class ServiceReport(TimestampMixin, Base):
    """Submitted by the provider at visit end — triggers REPORT_SUBMITTED → PAYOUT_READY."""

    __tablename__ = "service_reports"

    id: Mapped[int] = mapped_column(primary_key=True)
    booking_id: Mapped[int] = mapped_column(sa.ForeignKey("bookings.id"), unique=True, index=True)
    summary: Mapped[str] = mapped_column(sa.Text)
    vitals: Mapped[dict] = mapped_column(JSONB, default=dict)
    notes: Mapped[str] = mapped_column(sa.Text, default="")
    submitted_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True), server_default=sa.func.now()
    )


class Review(TimestampMixin, Base):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(primary_key=True)
    booking_id: Mapped[int] = mapped_column(sa.ForeignKey("bookings.id"), unique=True)
    patient_id: Mapped[int] = mapped_column(sa.ForeignKey("patient_profiles.id"))
    provider_id: Mapped[int] = mapped_column(sa.ForeignKey("providers.id"), index=True)
    rating: Mapped[int] = mapped_column(sa.Integer)
    text: Mapped[str] = mapped_column(sa.Text, default="")

    __table_args__ = (sa.CheckConstraint("rating BETWEEN 1 AND 5", name="reviews_rating_range"),)
