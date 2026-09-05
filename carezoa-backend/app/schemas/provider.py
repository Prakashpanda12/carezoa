from datetime import datetime

from pydantic import BaseModel, Field


class ServiceOut(BaseModel):
    id: int
    category: str
    name: str
    description: str
    duration_min: int
    base_price_inr: int
    icon: str

    model_config = {"from_attributes": True}


class ProviderOut(BaseModel):
    """Counterparty view: NEVER phone/email. Geo + trust signals only."""

    id: int
    display_name: str
    title: str
    qualifications: list
    languages: list
    city: str
    lat: float
    lng: float
    coverage_km: float
    bio: str
    years_exp: int
    rating_avg: float
    rating_count: int
    verification_status: str
    photo_color: str
    distance_km: float | None = None

    model_config = {"from_attributes": True}


class OfferingOut(BaseModel):
    service: ServiceOut
    price_inr: int

    model_config = {"from_attributes": True}


class ReviewOut(BaseModel):
    id: int
    rating: int
    text: str
    author_label: str  # masked, e.g. "M. Mohanty"
    created_at: datetime


class ProviderDetailOut(ProviderOut):
    offerings: list[OfferingOut]
    reviews: list[ReviewOut]


class RankedProviderOut(BaseModel):
    provider: ProviderOut
    score: float
    reasons: dict[str, float]


class AvailabilityWindowIn(BaseModel):
    weekday: int = Field(ge=0, le=6)
    start_min: int = Field(ge=0, le=1440)
    end_min: int = Field(ge=0, le=1440)


class CredentialUploadOut(BaseModel):
    credential_id: int
    upload_url: str  # pre-signed PUT
    expires_in_sec: int
