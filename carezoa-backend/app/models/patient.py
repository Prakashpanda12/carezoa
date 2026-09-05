from __future__ import annotations

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class PatientProfile(TimestampMixin, Base):
    __tablename__ = "patient_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(sa.ForeignKey("users.id"), unique=True, index=True)
    name: Mapped[str] = mapped_column(sa.String(120), default="")
    dob: Mapped[str] = mapped_column(sa.String(10), default="")  # DD/MM/YYYY (input format)
    gender: Mapped[str] = mapped_column(sa.String(8), default="")
    city: Mapped[str] = mapped_column(sa.String(80), default="")
    address: Mapped[str] = mapped_column(sa.String(320), default="")
    lat: Mapped[float | None] = mapped_column(sa.Float)
    lng: Mapped[float | None] = mapped_column(sa.Float)
    onboarding_done: Mapped[bool] = mapped_column(sa.Boolean, default=False)


class FamilyMember(TimestampMixin, Base):
    __tablename__ = "family_members"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(
        sa.ForeignKey("patient_profiles.id"), index=True, nullable=False
    )
    user_id: Mapped[int | None] = mapped_column(sa.ForeignKey("users.id"))
    name: Mapped[str] = mapped_column(sa.String(120))
    relation: Mapped[str] = mapped_column(sa.String(40))
    phone: Mapped[str] = mapped_column(sa.String(20))
    access_scope: Mapped[dict] = mapped_column(
        JSONB,
        default=lambda: {"view_visits": True, "view_records": False, "chat": False},
        nullable=False,
    )
    invite_status: Mapped[str] = mapped_column(
        sa.String(16), default="pending", nullable=False
    )  # pending | active | revoked
