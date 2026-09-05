"""
Booking state machine — the single source of truth for visit lifecycle logic.

Pure stdlib module (no FastAPI/SQLAlchemy imports) so the transition rules are
unit-testable in isolation. ONLY booking_service.py may import this module.
"""


from __future__ import annotations

from dataclasses import dataclass, field
from enum import StrEnum
from typing import Callable


class BookingStatus(StrEnum):
    PENDING_PAYMENT = "pending_payment"
    CONFIRMED = "confirmed"
    EN_ROUTE = "en_route"
    CHECKED_IN = "checked_in"
    IN_SERVICE = "in_service"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"
    DISPUTED = "disputed"


class PaymentStatus(StrEnum):
    UNPAID = "unpaid"
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    REFUNDED = "refunded"


class Event(StrEnum):
    PAYMENT_SUCCEEDED = "payment_succeeded"
    PAYMENT_FAILED = "payment_failed"
    RESCHEDULE = "reschedule"
    CANCEL = "cancel"
    PROVIDER_DEPARTED = "provider_departed"
    OTP_VERIFIED = "otp_verified"
    PROVIDER_NO_SHOW = "provider_no_show"
    SERVICE_STARTED = "service_started"
    SERVICE_COMPLETED = "service_completed"
    INCIDENT_RAISED = "incident_raised"
    DISPUTE_RESOLVED = "dispute_resolved"


class ActorRole(StrEnum):
    PATIENT = "patient"
    FAMILY_MEMBER = "family_member"
    PROVIDER = "provider"
    SUPPORT_AGENT = "support_agent"
    ADMIN = "admin"


class TransitionError(Exception):
    """Invalid transition (not in the table). Service layer maps this to HTTP 409."""

    def __init__(self, status: BookingStatus, event: Event):
        self.status = status
        self.event = event
        super().__init__(f"Event {event.value} is not allowed from status {status.value}")


class GuardFailed(Exception):
    """Transition exists but a guard rejected it."""

    def __init__(self, reason: str):
        self.reason = reason
        super().__init__(reason)


@dataclass(frozen=True)
class TransitionContext:
    actor_role: ActorRole
    hours_until_start: float | None = None  # for reschedule/cancel notice guards
    expected_otp: str | None = None
    provided_otp: str | None = None
    resolution: str | None = None  # for dispute resolution: "completed" | "cancelled"


@dataclass(frozen=True)
class TransitionPlan:
    from_status: BookingStatus
    event: Event
    to_status: BookingStatus
    stamp_field: str | None = None  # timeline column to set to now()
    effects: tuple[str, ...] = field(default_factory=tuple)


Guard = Callable[[TransitionContext], str | None]


def _always(_: TransitionContext) -> str | None:
    return None


def _otp_must_match(ctx: TransitionContext) -> str | None:
    if not ctx.expected_otp:
        return "No check-in code has been issued yet"
    if ctx.provided_otp != ctx.expected_otp:
        return "Incorrect check-in code"
    return None


def _cancel_notice(ctx: TransitionContext) -> str | None:
    if ctx.hours_until_start is not None and ctx.hours_until_start < 2:
        return "Too late to cancel online (under 2 hours) — contact support"
    return None


def _reschedule_notice(ctx: TransitionContext) -> str | None:
    if ctx.hours_until_start is not None and ctx.hours_until_start < 2:
        return "Too late to reschedule online — contact support"
    return None


def _resolution_guard(ctx: TransitionContext) -> str | None:
    if ctx.actor_role not in (ActorRole.ADMIN, ActorRole.SUPPORT_AGENT):
        return "Only support staff can resolve disputes"
    if ctx.resolution not in ("completed", "cancelled"):
        return "Resolution must be 'completed' or 'cancelled'"
    return None


@dataclass(frozen=True)
class _Rule:
    to_status: BookingStatus
    guard: Guard
    stamp: str | None = None
    effects: tuple[str, ...] = ()
    resolution_map: bool = False  # to_status resolved from ctx.resolution


# (from_status, event) -> rule
TRANSITION_TABLE: dict[tuple[BookingStatus, Event], _Rule] = {
    (BookingStatus.PENDING_PAYMENT, Event.PAYMENT_SUCCEEDED): _Rule(
        BookingStatus.CONFIRMED,
        _always,
        stamp="confirmed_at",
        effects=("notify_provider_new_booking", "notify_family_confirmed"),
    ),
    (BookingStatus.PENDING_PAYMENT, Event.PAYMENT_FAILED): _Rule(
        BookingStatus.PENDING_PAYMENT, _always, effects=("notify_family_payment_failed",)
    ),
    (BookingStatus.PENDING_PAYMENT, Event.RESCHEDULE): _Rule(
        BookingStatus.PENDING_PAYMENT, _always
    ),
    (BookingStatus.PENDING_PAYMENT, Event.CANCEL): _Rule(BookingStatus.CANCELLED, _always),
    (BookingStatus.CONFIRMED, Event.RESCHEDULE): _Rule(
        BookingStatus.CONFIRMED, _reschedule_notice, effects=("notify_provider_rescheduled",)
    ),
    (BookingStatus.CONFIRMED, Event.CANCEL): _Rule(
        BookingStatus.CANCELLED,
        _cancel_notice,
        effects=("initiate_refund_if_paid", "notify_provider_release"),
    ),
    (BookingStatus.CONFIRMED, Event.PROVIDER_DEPARTED): _Rule(
        BookingStatus.EN_ROUTE,
        _always,
        stamp="en_route_at",
        effects=("issue_checkin_otp", "notify_family_provider_departed"),
    ),
    (BookingStatus.CONFIRMED, Event.PROVIDER_NO_SHOW): _Rule(
        BookingStatus.NO_SHOW, _always, effects=("initiate_refund_if_paid", "alert_support")
    ),
    (BookingStatus.EN_ROUTE, Event.OTP_VERIFIED): _Rule(
        BookingStatus.CHECKED_IN,
        _otp_must_match,
        stamp="checked_in_at",
        effects=("notify_family_checked_in",),
    ),
    (BookingStatus.EN_ROUTE, Event.INCIDENT_RAISED): _Rule(
        BookingStatus.DISPUTED, _always, effects=("alert_support",)
    ),
    (BookingStatus.CHECKED_IN, Event.SERVICE_STARTED): _Rule(
        BookingStatus.IN_SERVICE, _always, stamp="started_at"
    ),
    (BookingStatus.CHECKED_IN, Event.INCIDENT_RAISED): _Rule(
        BookingStatus.DISPUTED, _always, effects=("alert_support",)
    ),
    (BookingStatus.IN_SERVICE, Event.SERVICE_COMPLETED): _Rule(
        BookingStatus.COMPLETED,
        _always,
        stamp="completed_at",
        effects=("request_service_report", "notify_family_completed"),
    ),
    (BookingStatus.IN_SERVICE, Event.INCIDENT_RAISED): _Rule(
        BookingStatus.DISPUTED, _always, effects=("alert_support",)
    ),
    (BookingStatus.DISPUTED, Event.DISPUTE_RESOLVED): _Rule(
        BookingStatus.DISPUTED, _resolution_guard, resolution_map=True
    ),
    (BookingStatus.NO_SHOW, Event.DISPUTE_RESOLVED): _Rule(
        BookingStatus.NO_SHOW, _resolution_guard, resolution_map=True
    ),
}

_TERMINAL = {BookingStatus.COMPLETED, BookingStatus.CANCELLED}


def allowed_events(status: BookingStatus) -> tuple[Event, ...]:
    return tuple(e for (s, e) in TRANSITION_TABLE if s == status)


def is_terminal(status: BookingStatus) -> bool:
    return status in _TERMINAL


def assert_transition(
    status: BookingStatus, event: Event, ctx: TransitionContext
) -> TransitionPlan:
    """Validate a transition. Raises TransitionError / GuardFailed. Pure."""
    if is_terminal(status):
        raise TransitionError(status, event)
    rule = TRANSITION_TABLE.get((status, event))
    if rule is None:
        raise TransitionError(status, event)
    reason = rule.guard(ctx)
    if reason is not None:
        raise GuardFailed(reason)

    to_status = rule.to_status
    if rule.resolution_map:
        to_status = (
            BookingStatus.COMPLETED if ctx.resolution == "completed" else BookingStatus.CANCELLED
        )
    return TransitionPlan(
        from_status=status,
        event=event,
        to_status=to_status,
        stamp_field=rule.stamp,
        effects=tuple(rule.effects),
    )


def transition(
    status: BookingStatus, event: Event, ctx: TransitionContext
) -> TransitionPlan:
    """Alias of assert_transition for readability at call sites."""
    return assert_transition(status, event, ctx)
