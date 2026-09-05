from __future__ import annotations

from datetime import datetime
from enum import StrEnum

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class FlagSeverity(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class CommunicationThread(TimestampMixin, Base):
    __tablename__ = "communication_threads"

    id: Mapped[int] = mapped_column(primary_key=True)
    booking_id: Mapped[int] = mapped_column(sa.ForeignKey("bookings.id"), unique=True, index=True)


class CommunicationEvent(TimestampMixin, Base):
    """Every in-app message. Anti-bypass scans flag (never silently block) suspicious ones."""

    __tablename__ = "communication_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    thread_id: Mapped[int] = mapped_column(
        sa.ForeignKey("communication_threads.id"), index=True
    )
    sender_user_id: Mapped[int] = mapped_column(sa.ForeignKey("users.id"))
    author_name: Mapped[str] = mapped_column(sa.String(120), default="")
    # body stored ALREADY SCRUBBED of contact patterns (defense in depth);
    # flags retain what was attempted for support review.
    body: Mapped[str] = mapped_column(sa.Text)
    flagged: Mapped[bool] = mapped_column(sa.Boolean, default=False, index=True)
    flag_severity: Mapped[FlagSeverity | None] = mapped_column(
        sa.Enum(FlagSeverity, name="flag_severity", native_enum=False, length=8)
    )
    flag_patterns: Mapped[list] = mapped_column(JSONB, default=list)
    reviewed_by: Mapped[int | None] = mapped_column(sa.ForeignKey("users.id"))
    reviewed_at: Mapped[datetime | None] = mapped_column(sa.DateTime(timezone=True))


class NotificationRecord(TimestampMixin, Base):
    __tablename__ = "notification_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(sa.ForeignKey("users.id"), index=True)
    channel: Mapped[str] = mapped_column(sa.String(16))  # sms | whatsapp | push
    template: Mapped[str] = mapped_column(sa.String(60))
    payload: Mapped[dict] = mapped_column(JSONB, default=dict)
    status: Mapped[str] = mapped_column(sa.String(16), default="queued")
    sent_at: Mapped[datetime | None] = mapped_column(sa.DateTime(timezone=True))
