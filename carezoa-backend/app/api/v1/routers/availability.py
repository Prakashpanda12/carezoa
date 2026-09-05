from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import require_role
from app.core.exceptions import NotFoundError
from app.core.security import Role
from app.db.session import get_session
from app.models.user import User
from app.repositories import provider_repository as repo
from app.schemas.provider import AvailabilityWindowIn

router = APIRouter(prefix="/providers/me/availability", tags=["availability"])


@router.get("")
async def my_availability(
    user: User = Depends(require_role(Role.PROVIDER)),
    session: AsyncSession = Depends(get_session),
):
    provider = await repo.get_provider_for_user(session, user.id)
    if provider is None:
        raise NotFoundError("Provider profile not found")
    rows = await repo.list_availability(session, provider.id)
    return {
        "items": [
            {"weekday": r.weekday, "start_min": r.start_min, "end_min": r.end_min} for r in rows
        ]
    }


@router.put("")
async def set_availability(
    windows: list[AvailabilityWindowIn],
    user: User = Depends(require_role(Role.PROVIDER)),
    session: AsyncSession = Depends(get_session),
):
    provider = await repo.get_provider_for_user(session, user.id)
    if provider is None:
        raise NotFoundError("Provider profile not found")
    await repo.replace_availability(
        session, provider.id, [w.model_dump() for w in windows]
    )
    await session.commit()
    return {"ok": True}
