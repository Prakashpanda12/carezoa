from __future__ import annotations

from enum import StrEnum

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class VerificationStatus(StrEnum):
    UNVERIFIED = "unverified"
    PENDING_REVIEW = "pending_review"
    VERIFIED = "verified"
    SUSPENDED = "suspended"


class Provider(TimestampMixin, Base):
    __tablename__ = "providers"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(sa.ForeignKey("users.id"), unique=True)
    display_name: Mapped[str] = mapped_column(sa.String(120))
    title: Mapped[str] = mapped_column(sa.String(160))
    qualifications: Mapped[list] = mapped_column(JSONB, default=list)
    languages: Mapped[list] = mapped_column(JSONB, default=list)
    city: Mapped[str] = mapped_column(sa.String(80), index=True)
    lat: Mapped[float] = mapped_column(sa.Float)
    lng: Mapped[float] = mapped_column(sa.Float)
    coverage_km: Mapped[float] = mapped_column(sa.Float, default=15)
    bio: Mapped[str] = mapped_column(sa.Text, default="")
    years_exp: Mapped[int] = mapped_column(sa.Integer, default=0)
    rating_avg: Mapped[float] = mapped_column(sa.Float, default=0)
    rating_count: Mapped[int] = mapped_column(sa.Integer, default=0)
    acceptance_rate: Mapped[float] = mapped_column(sa.Float, default=1.0)  # 0..1
    cancellation_rate: Mapped[float] = mapped_column(sa.Float, default=0.0)  # 0..1
    verification_status: Mapped[VerificationStatus] = mapped_column(
        sa.Enum(VerificationStatus, name="verification_status", native_enum=False, length=24),
        default=VerificationStatus.UNVERIFIED,
        nullable=False,
    )
    photo_color: Mapped[str] = mapped_column(sa.String(24), default="moss")
    # NOTE: no phone/email columns by design — masked telephony owns contactability.


class ProviderCredential(TimestampMixin, Base):
    __tablename__ = "provider_credentials"

    id: Mapped[int] = mapped_column(primary_key=True)
    provider_id: Mapped[int] = mapped_column(sa.ForeignKey("providers.id"), index=True)
    doc_type: Mapped[str] = mapped_column(sa.String(40))  # license | id_proof | certificate
    s3_key: Mapped[str] = mapped_column(sa.String(512))  # object storage key only
    status: Mapped[str] = mapped_column(sa.String(24), default="pending_review")
    verified_at: Mapped[str | None] = mapped_column(sa.DateTime(timezone=True))
    expires_at: Mapped[str | None] = mapped_column(sa.DateTime(timezone=True))


class ProviderServiceOffering(TimestampMixin, Base):
    __tablename__ = "provider_service_offerings"

    id: Mapped[int] = mapped_column(primary_key=True)
    provider_id: Mapped[int] = mapped_column(sa.ForeignKey("providers.id"), index=True)
    service_id: Mapped[int] = mapped_column(sa.ForeignKey("services.id"), index=True)
    price_inr: Mapped[int] = mapped_column(sa.Integer)
    active: Mapped[bool] = mapped_column(sa.Boolean, default=True)

    __table_args__ = (sa.UniqueConstraint("provider_id", "service_id", name="uq_offering"),)


class ProviderAvailability(TimestampMixin, Base):
    __tablename__ = "provider_availability"

    id: Mapped[int] = mapped_column(primary_key=True)
    provider_id: Mapped[int] = mapped_column(sa.ForeignKey("providers.id"), index=True)
    weekday: Mapped[int] = mapped_column(sa.Integer)  # 0=Mon
    start_min: Mapped[int] = mapped_column(sa.Integer)  # minutes from midnight
    end_min: Mapped[int] = mapped_column(sa.Integer)

    __table_args__ = (
        sa.CheckConstraint("weekday BETWEEN 0 AND 6", name="availability_weekday"),
        sa.CheckConstraint("end_min > start_min", name="availability_window"),
    )
