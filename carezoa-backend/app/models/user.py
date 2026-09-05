from __future__ import annotations

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from app.core.security import Role
from app.db.base import Base, TimestampMixin


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    phone: Mapped[str] = mapped_column(sa.String(20), unique=True, index=True)
    email: Mapped[str | None] = mapped_column(sa.String(320), unique=True)
    password_hash: Mapped[str | None] = mapped_column(sa.String(255))
    role: Mapped[Role] = mapped_column(
        sa.Enum(Role, name="user_role", native_enum=False, length=32),
        default=Role.PATIENT,
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(sa.Boolean, default=True, nullable=False)
    mfa_enabled: Mapped[bool] = mapped_column(sa.Boolean, default=False, nullable=False)

    __table_args__ = (
        sa.CheckConstraint("phone ~ '^\\+?[0-9]{10,15}$'", name="users_phone_e164"),
    )
