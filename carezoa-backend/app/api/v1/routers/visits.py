"""Visit detail + care records (patient/family-facing)."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user
from app.api.v1.routers.bookings import booking_out
from app.core.exceptions import NotFoundError
from app.db.session import get_session
from app.models.user import User
from app.repositories import booking_repository as repo
from app.schemas.booking import CareReportOut

router = APIRouter(tags=["visits"])


@router.get("/visits/{booking_id}")
async def visit_detail(
    booking_id: int,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    booking = await repo.get_booking(session, booking_id)
    if booking is None:
        raise NotFoundError("Visit not found")
    return await booking_out(session, booking, include_otp=True)


@router.get("/records", response_model=list[CareReportOut])
async def care_records(
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    reports = await repo.list_reports(session)
    out = []
    for r in reports:
        booking = await repo.get_booking(session, r.booking_id)
        if booking is None:
            continue
        out.append(
            CareReportOut(
                id=r.id,
                booking=await booking_out(session, booking, include_otp=True),
                summary=r.summary,
                vitals=r.vitals,
                notes=r.notes,
                created_at=r.created_at,
            )
        )
    return out
