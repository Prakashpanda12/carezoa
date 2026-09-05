"""Auth: OTP request/verify (rate-limited), token refresh."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.exceptions import OtpMismatchError, RateLimitedError, UnauthorizedError
from app.core.rate_limit import SlidingWindowRateLimiter
from app.core.security import (
    Role,
    decode_token,
    hash_otp,
    issue_token_pair,
    new_otp_code,
)
from app.db.session import get_session
from app.repositories import identity_repository as repo
from app.schemas.identity import OtpRequestIn, OtpRequestOut, OtpVerifyIn, TokenOut, UserOut
from app.services import notification_service
from app.api.v1.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])
otp_limiter = SlidingWindowRateLimiter(limit=get_settings().rate_limit_otp_per_min, window_seconds=60)
auth_limiter = SlidingWindowRateLimiter(limit=get_settings().rate_limit_auth_per_min, window_seconds=60)


@router.get("/me", response_model=UserOut)
async def get_me(user: User = Depends(get_current_user)):
    return user



@router.post("/otp/request", response_model=OtpRequestOut)
async def otp_request(payload: OtpRequestIn, request: Request, session: AsyncSession = Depends(get_session)):
    settings = get_settings()
    phone = payload.phone.replace(" ", "").replace("-", "")
    try:
        otp_limiter.check(f"otp:{phone}:{request.client.host if request.client else ''}")
    except RateLimitedError:
        raise
    code = new_otp_code()
    challenge = await repo.create_otp_challenge(
        session, phone=phone, code_hash=hash_otp(phone, code), ttl_minutes=settings.otp_ttl_min
    )
    user = await repo.get_user_by_phone(session, phone)
    if user is not None:
        await notification_service.notify(
            session, user_id=user.id, channel="sms", template="otp.{{code}}", payload={"code": code}
        )
    await session.commit()
    return OtpRequestOut(
        request_id=challenge.id,
        expires_in_sec=settings.otp_ttl_min * 60,
        dev_code=None if settings.is_prod else code,
    )


@router.post("/otp/verify", response_model=TokenOut)
async def otp_verify(payload: OtpVerifyIn, request: Request, session: AsyncSession = Depends(get_session)):
    settings = get_settings()
    phone = payload.phone.replace(" ", "").replace("-", "")
    auth_limiter.check(f"verify:{request.client.host if request.client else ''}")

    challenge = await repo.latest_otp_challenge(session, phone)
    if challenge is None or challenge.expires_at < datetime.now(timezone.utc):
        raise OtpMismatchError("Code expired — request a new one")
    challenge.attempts += 1
    if challenge.attempts > 5:
        challenge.consumed = True
        await session.commit()
        raise OtpMismatchError("Too many attempts — request a new code")
    if challenge.code_hash != hash_otp(phone, payload.code):
        await session.commit()
        raise OtpMismatchError("Incorrect code")

    challenge.consumed = True
    user = await repo.get_user_by_phone(session, phone)
    is_new = False
    if user is None:
        user = await repo.create_user(session, phone=phone, role=Role.PATIENT)
        await repo.create_patient_profile(session, user_id=user.id)
        is_new = True
    profile = await repo.get_patient_by_user(session, user.id)
    pair = issue_token_pair(user.id, user.role)
    await session.commit()
    return TokenOut(
        access_token=pair.access_token,
        refresh_token=pair.refresh_token,
        access_expires_at=pair.access_expires_at,
        is_new_user=is_new or not (profile and profile.onboarding_done),
    )


@router.post("/refresh", response_model=TokenOut)
async def refresh(payload: dict, session: AsyncSession = Depends(get_session)):
    token = str(payload.get("refresh_token", ""))
    try:
        data = decode_token(token)
        if data.get("type") != "refresh":
            raise UnauthorizedError("Not a refresh token")
        user = await repo.get_user(session, int(data["sub"]))
    except UnauthorizedError:
        raise
    except Exception:
        raise UnauthorizedError("Invalid refresh token")
    if user is None or not user.is_active:
        raise UnauthorizedError("Account disabled")
    profile = await repo.get_patient_by_user(session, user.id)
    pair = issue_token_pair(user.id, user.role)
    return TokenOut(
        access_token=pair.access_token,
        refresh_token=pair.refresh_token,
        access_expires_at=pair.access_expires_at,
        is_new_user=not (profile and profile.onboarding_done),
    )
