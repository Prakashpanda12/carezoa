from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user
from app.core.exceptions import NotFoundError
from app.db.session import get_session
from app.models.user import User
from app.repositories import identity_repository as repo
from app.schemas.identity import PatientOut, ProfileEditIn

router = APIRouter(prefix="/patients", tags=["patients"])


@router.get("/me", response_model=PatientOut)
async def get_me(user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    profile = await repo.get_patient_by_user(session, user.id)
    if profile is None:
        raise NotFoundError("Patient profile not found")
    return profile


@router.patch("/me", response_model=PatientOut)
async def edit_me(
    payload: ProfileEditIn,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    profile = await repo.get_patient_by_user(session, user.id)
    if profile is None:
        raise NotFoundError("Patient profile not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    if profile.name and profile.dob and profile.gender:
        profile.onboarding_done = True
    await repo.save_patient_profile(session, profile)
    await session.commit()
    return profile
