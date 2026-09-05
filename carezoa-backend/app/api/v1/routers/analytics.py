from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import require_role
from app.core.security import Role
from app.db.session import get_session
from app.models.booking import Booking
from app.models.payment import GatewayPaymentStatus, Payment
from app.models.user import User
from app.repositories import engagement_repository as engagement

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/overview")
async def overview(
    _: User = Depends(require_role(Role.ADMIN, Role.SUPPORT_AGENT)),
    session: AsyncSession = Depends(get_session),
):
    by_status = (
        await session.execute(select(Booking.status, func.count()).group_by(Booking.status))
    ).all()
    gmv = (
        await session.execute(
            select(func.coalesce(func.sum(Payment.amount_inr), 0)).where(
                Payment.status == GatewayPaymentStatus.SUCCESS
            )
        )
    ).scalar_one()
    audits = await engagement.audit_counts(session)
    return {
        "bookings_by_status": {s.value if hasattr(s, "value") else s: c for s, c in by_status},
        "gmv_inr": gmv,
        "audit_events_by_entity": audits,
    }
