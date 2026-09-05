from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.repositories import provider_repository as repo
from app.schemas.provider import ServiceOut

router = APIRouter(prefix="/services", tags=["services"])


@router.get("", response_model=dict)
async def services(session: AsyncSession = Depends(get_session)):
    items = await repo.list_services(session)
    return {
        "categories": sorted({s.category for s in items}),
        "items": [ServiceOut.model_validate(s) for s in items],
    }
