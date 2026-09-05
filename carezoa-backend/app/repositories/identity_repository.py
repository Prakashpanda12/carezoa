"""Data access for users, patient profiles, OTP challenges, family members. No logic."""

from __future__ import annotations

from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.booking import OtpChallenge
from app.models.patient import FamilyMember, PatientProfile
from app.models.user import User


async def get_user_by_phone(session: AsyncSession, phone: str) -> User | None:
    return (await session.execute(select(User).where(User.phone == phone))).scalar_one_or_none()


async def get_user(session: AsyncSession, user_id: int) -> User | None:
    return await session.get(User, user_id)


async def create_user(session: AsyncSession, *, phone: str, role) -> User:
    user = User(phone=phone, role=role)
    session.add(user)
    await session.flush()
    return user


async def get_patient_by_user(session: AsyncSession, user_id: int) -> PatientProfile | None:
    res = await session.execute(
        select(PatientProfile).where(PatientProfile.user_id == user_id)
    )
    return res.scalar_one_or_none()


async def create_patient_profile(session: AsyncSession, *, user_id: int) -> PatientProfile:
    profile = PatientProfile(user_id=user_id)
    session.add(profile)
    await session.flush()
    return profile


async def save_patient_profile(session: AsyncSession, profile: PatientProfile) -> PatientProfile:
    session.add(profile)
    await session.flush()
    return profile


async def create_otp_challenge(
    session: AsyncSession, *, phone: str, code_hash: str, ttl_minutes: int
) -> OtpChallenge:
    challenge = OtpChallenge(
        phone=phone,
        code_hash=code_hash,
        expires_at=datetime.utcnow() + timedelta(minutes=ttl_minutes),
    )
    session.add(challenge)
    await session.flush()
    return challenge


async def latest_otp_challenge(session: AsyncSession, phone: str) -> OtpChallenge | None:
    res = await session.execute(
        select(OtpChallenge)
        .where(OtpChallenge.phone == phone, OtpChallenge.consumed.is_(False))
        .order_by(OtpChallenge.id.desc())
        .limit(1)
    )
    return res.scalar_one_or_none()


async def list_family(session: AsyncSession, patient_id: int) -> list[FamilyMember]:
    res = await session.execute(
        select(FamilyMember)
        .where(FamilyMember.patient_id == patient_id)
        .order_by(FamilyMember.id)
    )
    return list(res.scalars())


async def add_family_member(session: AsyncSession, member: FamilyMember) -> FamilyMember:
    session.add(member)
    await session.flush()
    return member


async def get_family_member(session: AsyncSession, member_id: int) -> FamilyMember | None:
    return await session.get(FamilyMember, member_id)
