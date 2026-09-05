from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import require_role
from app.core.security import Role
from app.db.session import get_session
from app.models.user import User
from app.repositories import engagement_repository as engagement

router = APIRouter(prefix="/incidents", tags=["incidents"])


@router.get("")
async def list_all(
    _: User = Depends(require_role(Role.ADMIN, Role.SUPPORT_AGENT)),
    session: AsyncSession = Depends(get_session),
):
    rows = await engagement.list_incidents(session)
    return {
        "items": [
            {
                "id": i.id,
                "booking_id": i.booking_id,
                "type": i.type,
                "status": i.status.value,
                "description": i.description,
            }
            for i in rows
        ]
    }
