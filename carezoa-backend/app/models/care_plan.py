from __future__ import annotations

from datetime import datetime
from enum import StrEnum

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class SubscriptionStatus(StrEnum):
    ACTIVE = "active"
    PAUSED = "paused"
    CANCELLED = "cancelled"


class CarePackage(TimestampMixin, Base):
    __tablename__ = "care_packages"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(sa.String(120))
    description: Mapped[str] = mapped_column(sa.Text, default="")
    visits_per_month: Mapped[int] = mapped_column(sa.Integer)
    price_per_month_inr: Mapped[int] = mapped_column(sa.Integer)
    includes: Mapped[list] = mapped_column(JSONB, default=list)
    best_for: Mapped[str] = mapped_column(sa.String(160), default="")
    active: Mapped[bool] = mapped_column(sa.Boolean, default=True)


class CarePlanSubscription(TimestampMixin, Base):
    __tablename__ = "care_plan_subscriptions"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(sa.ForeignKey("patient_profiles.id"), index=True)
    package_id: Mapped[int] = mapped_column(sa.ForeignKey("care_packages.id"))
    status: Mapped[SubscriptionStatus] = mapped_column(
        sa.Enum(SubscriptionStatus, name="subscription_status", native_enum=False, length=16),
        default=SubscriptionStatus.ACTIVE,
        nullable=False,
    )
    visits_used_this_cycle: Mapped[int] = mapped_column(sa.Integer, default=0)
    current_period_end: Mapped[datetime | None] = mapped_column(sa.DateTime(timezone=True))


class CarePlanOccurrence(TimestampMixin, Base):
    """Generated recurring visits (worker: care-plan recurrence generation)."""

    __tablename__ = "care_plan_occurrences"

    id: Mapped[int] = mapped_column(primary_key=True)
    subscription_id: Mapped[int] = mapped_column(
        sa.ForeignKey("care_plan_subscriptions.id"), index=True
    )
    booking_id: Mapped[int | None] = mapped_column(sa.ForeignKey("bookings.id"))
    scheduled_for: Mapped[datetime] = mapped_column(sa.DateTime(timezone=True))
    generated: Mapped[bool] = mapped_column(sa.Boolean, default=False)
