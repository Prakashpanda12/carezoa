from __future__ import annotations

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class Service(TimestampMixin, Base):
    """The service catalogue (nursing, elder care, physio… later labs/transport)."""

    __tablename__ = "services"

    id: Mapped[int] = mapped_column(primary_key=True)
    category: Mapped[str] = mapped_column(sa.String(60), index=True)
    name: Mapped[str] = mapped_column(sa.String(120))
    description: Mapped[str] = mapped_column(sa.Text, default="")
    duration_min: Mapped[int] = mapped_column(sa.Integer, default=60)
    base_price_inr: Mapped[int] = mapped_column(sa.Integer)
    icon: Mapped[str] = mapped_column(sa.String(40), default="medkit")
    active: Mapped[bool] = mapped_column(sa.Boolean, default=True)
