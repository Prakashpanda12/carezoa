from datetime import datetime

from pydantic import BaseModel, Field


class OtpRequestIn(BaseModel):
    phone: str = Field(pattern=r"^\+?[0-9\s-]{10,17}$")


class OtpRequestOut(BaseModel):
    request_id: int
    expires_in_sec: int
    dev_code: str | None = None  # sandbox only


class OtpVerifyIn(BaseModel):
    phone: str
    code: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")


class PhoneCheckIn(BaseModel):
    phone: str = Field(pattern=r"^\+?[0-9\s-]{10,17}$")


class PhoneCheckOut(BaseModel):
    exists: bool
    needs_onboarding: bool = False


class SignupIn(BaseModel):
    phone: str = Field(pattern=r"^\+?[0-9\s-]{10,17}$")
    name: str = Field(min_length=2, max_length=120)
    dob: str | None = Field(default=None, pattern=r"^\d{2}/\d{2}/\d{4}$")
    gender: str | None = Field(default=None, pattern=r"^[FMO]$")
    city: str | None = Field(default=None, max_length=80)
    address: str | None = Field(default=None, max_length=320)


class SignupOut(BaseModel):
    request_id: int
    expires_in_sec: int
    dev_code: str | None = None  # sandbox only


class SignupVerifyIn(BaseModel):
    phone: str
    code: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")


class SignupVerifyOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    access_expires_at: int
    is_new_user: bool = True
    patient: PatientOut


class LoginIn(BaseModel):
    phone: str = Field(pattern=r"^\+?[0-9\s-]{10,17}$")


class LoginOut(BaseModel):
    request_id: int
    expires_in_sec: int
    dev_code: str | None = None  # sandbox only


class LoginVerifyIn(BaseModel):
    phone: str
    code: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")


class LoginVerifyOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    access_expires_at: int
    is_new_user: bool = False
    patient: PatientOut


class TokenOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    access_expires_at: int
    is_new_user: bool


class UserOut(BaseModel):
    id: int
    phone: str
    role: str
    is_active: bool
    mfa_enabled: bool

    model_config = {"from_attributes": True}


class PatientOut(BaseModel):
    id: int
    user_id: int
    name: str
    dob: str
    gender: str
    city: str
    address: str
    lat: float | None
    lng: float | None
    onboarding_done: bool

    model_config = {"from_attributes": True}


class ProfileEditIn(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    dob: str | None = Field(default=None, pattern=r"^\d{2}/\d{2}/\d{4}$")
    gender: str | None = Field(default=None, pattern=r"^[FMO]$")
    city: str | None = Field(default=None, max_length=80)
    address: str | None = Field(default=None, min_length=6, max_length=320)
    lat: float | None = None
    lng: float | None = None


class FamilyAccessScope(BaseModel):
    view_visits: bool = True
    view_records: bool = False
    chat: bool = False


class FamilyInviteIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    relation: str = Field(min_length=2, max_length=40)
    phone: str = Field(pattern=r"^\+?[0-9\s-]{10,17}$")
    access_scope: FamilyAccessScope = FamilyAccessScope()


class FamilyMemberOut(BaseModel):
    id: int
    name: str
    relation: str
    phone: str
    access_scope: FamilyAccessScope
    invite_status: str
    created_at: datetime

    model_config = {"from_attributes": True}
