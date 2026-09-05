from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user
from app.core.exceptions import NotFoundError
from app.db.session import get_session
from app.models.patient import FamilyMember
from app.models.user import User
from app.repositories import identity_repository as identity
from app.schemas.identity import FamilyInviteIn, FamilyMemberOut

router = APIRouter(prefix="/family", tags=["family"])


async def _patient_id(session: AsyncSession, user: User) -> int:
    profile = await identity.get_patient_by_user(session, user.id)
    if profile is None:
        raise NotFoundError("Patient profile not found")
    return profile.id


@router.get("", response_model=list[FamilyMemberOut])
async def list_members(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    return await identity.list_family(session, await _patient_id(session, user))


@router.post("", response_model=FamilyMemberOut, status_code=201)
async def invite(
    payload: FamilyInviteIn,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    member = await identity.add_family_member(
        session,
        FamilyMember(
            patient_id=await _patient_id(session, user),
            name=payload.name,
            relation=payload.relation,
            phone=payload.phone.replace(" ", ""),
            access_scope=payload.access_scope.model_dump(),
        ),
    )
    await session.commit()
    return member


@router.patch("/{member_id}", response_model=FamilyMemberOut)
async def update_member(
    member_id: int,
    payload: dict,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    member = await identity.get_family_member(session, member_id)
    if member is None:
        raise NotFoundError("Member not found")
    if member.patient_id != await _patient_id(session, user):
        raise NotFoundError("Member not found")
    if "access_scope" in payload:
        member.access_scope = {
            "view_visits": payload["access_scope"].get("view_visits", True),
            "view_records": payload["access_scope"].get("view_records", False),
            "chat": payload["access_scope"].get("chat", False),
        }
    if payload.get("action") == "revoke":
        member.invite_status = "revoked"
    if payload.get("action") == "resend":
        member.invite_status = "pending"
    await session.commit()
    return member
