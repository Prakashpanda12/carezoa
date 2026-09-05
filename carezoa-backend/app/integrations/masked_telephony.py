"""Masked telephony adapter interface + mock implementation (relay numbers only)."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Protocol
from uuid import uuid4


@dataclass(frozen=True)
class MaskedSession:
    call_id: str
    masked_number: str
    expires_at: datetime


class MaskedTelephony(Protocol):
    def create_session(self, *, booking_id: int, ttl_minutes: int = 5) -> MaskedSession: ...


class MockTelephonyProvider:
    """Mock relay provider: pool of virtual numbers, no real counterparty digits."""

    def __init__(self, relay_pool: tuple[str, ...] = ("+91 80 4719 2417", "+91 80 4719 2418")):
        self._pool = relay_pool

    def create_session(self, *, booking_id: int, ttl_minutes: int = 5) -> MaskedSession:
        return MaskedSession(
            call_id=f"call_{uuid4().hex[:12]}",
            masked_number=self._pool[booking_id % len(self._pool)],
            expires_at=datetime.utcnow() + timedelta(minutes=ttl_minutes),
        )
