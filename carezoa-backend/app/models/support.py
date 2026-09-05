from __future__ import annotations

from enum import StrEnum

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class TicketStatus(StrEnum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"


class IncidentStatus(StrEnum):
    OPEN = "open"
    INVESTIGATING = "investigating"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"


class Ticket(TimestampMixin, Base):
    __tablename__ = "tickets"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(sa.ForeignKey("users.id"), index=True)
    subject: Mapped[str] = mapped_column(sa.String(160))
    body: Mapped[str] = mapped_column(sa.Text)
    status: Mapped[TicketStatus] = mapped_column(
        sa.Enum(TicketStatus, name="ticket_status", native_enum=False, length=16),
        default=TicketStatus.OPEN,
        nullable=False,
    )
    assigned_to: Mapped[int | None] = mapped_column(sa.ForeignKey("users.id"))


class Incident(TimestampMixin, Base):
    """Safety incidents attached to visits — feeds provider reliability scoring."""

    __tablename__ = "incidents"

    id: Mapped[int] = mapped_column(primary_key=True)
    booking_id: Mapped[int] = mapped_column(sa.ForeignKey("bookings.id"), index=True)
    reporter_user_id: Mapped[int] = mapped_column(sa.ForeignKey("users.id"))
    type: Mapped[str] = mapped_column(sa.String(40))  # safety | no_show | misconduct | other
    description: Mapped[str] = mapped_column(sa.Text)
    status: Mapped[IncidentStatus] = mapped_column(
        sa.Enum(IncidentStatus, name="incident_status", native_enum=False, length=16),
        default=IncidentStatus.OPEN,
        nullable=False,
    )
    resolution: Mapped[str | None] = mapped_column(sa.Text)


class AuditLog(Base):
    """
    INSERT-ONLY event sourcing for every state change. No updated_at, and the
    repository layer refuses UPDATE/DELETE (enforce via DB REVOKE in migrations).
    """

    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    actor_user_id: Mapped[int | None] = mapped_column(sa.ForeignKey("users.id"))
    actor_role: Mapped[str] = mapped_column(sa.String(32), default="system")
    entity_type: Mapped[str] = mapped_column(sa.String(40), index=True)  # booking | payment | incident…
    entity_id: Mapped[int] = mapped_column(sa.Integer, index=True)
    action: Mapped[str] = mapped_column(sa.String(80))
    from_state: Mapped[str | None] = mapped_column(sa.String(32))
    to_state: Mapped[str | None] = mapped_column(sa.String(32))
    meta: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[str] = mapped_column(
        sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
    )
