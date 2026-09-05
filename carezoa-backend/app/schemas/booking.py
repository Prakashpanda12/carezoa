from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.provider import ProviderOut, ServiceOut


class PatientSnapshot(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    age: int = Field(ge=0, le=120)
    gender: str = Field(pattern=r"^[FMO]$")


class BookingCreateIn(BaseModel):
    provider_id: int
    service_id: int
    starts_at: datetime
    patient: PatientSnapshot
    address: str = Field(min_length=6, max_length=320)
    city: str = Field(min_length=2, max_length=80)
    instructions: str = Field(default="", max_length=500)
    family_member_id: int | None = None


class TimelineEventOut(BaseModel):
    key: str
    label: str
    at: datetime | None


class BookingOut(BaseModel):
    id: int
    status: str
    payment_status: str
    starts_at: datetime
    duration_min: int
    patient: PatientSnapshot
    address: str
    city: str
    instructions: str
    amount_inr: int
    currency: str
    checkin_otp: str | None  # family-side only; provider serializers request without it
    provider_id: int
    service_id: int
    timeline: list[TimelineEventOut]
    provider: ProviderOut | None = None
    service: ServiceOut | None = None
    created_at: datetime


class RescheduleIn(BaseModel):
    starts_at: datetime


class OtpVerifyVisitIn(BaseModel):
    code: str = Field(min_length=4, max_length=4, pattern=r"^\d{4}$")


class IncidentReportIn(BaseModel):
    booking_id: int
    type: str = Field(pattern=r"^(safety|no_show|misconduct|other)$")
    description: str = Field(min_length=10, max_length=2000)


class ServiceReportIn(BaseModel):
    summary: str = Field(min_length=10, max_length=4000)
    vitals: dict[str, str] = {}
    notes: str = Field(default="", max_length=2000)


class RatingIn(BaseModel):
    booking_id: int
    rating: int = Field(ge=1, le=5)
    text: str = Field(default="", max_length=500)


class MessageIn(BaseModel):
    body: str = Field(min_length=1, max_length=1000)


class MessageOut(BaseModel):
    id: int
    sender: str
    author_name: str
    body: str  # already scrubbed server-side
    flagged: bool
    created_at: datetime


class MaskedCallOut(BaseModel):
    call_id: str
    masked_number: str  # relay number, never the real counterparty number
    expires_at: datetime


class PaymentIntentOut(BaseModel):
    payment_id: int
    booking_id: int
    amount_inr: int
    currency: str
    checkout_ref: str
    checkout_url: str


class WebhookOut(BaseModel):
    received: bool
    event_ref: str | None = None


class TicketIn(BaseModel):
    subject: str = Field(min_length=4, max_length=160)
    body: str = Field(min_length=10, max_length=2000)


class TicketOut(BaseModel):
    id: int
    subject: str
    status: str
    created_at: datetime


class PackageOut(BaseModel):
    id: int
    name: str
    description: str
    visits_per_month: int
    price_per_month_inr: int
    includes: list
    best_for: str
    subscribed: bool = False


class CareReportOut(BaseModel):
    id: int
    booking: BookingOut
    summary: str
    vitals: dict[str, str]
    notes: str
    created_at: datetime
