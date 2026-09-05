"""Payouts — triggered ONLY by report submission; processing via workers/admin."""

from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import require_role
from app.core.exceptions import NotFoundError
from app.core.security import Role
from app.db.session import get_session
from app.repositories import engagement_repository as engagement
from app.repositories import provider_repository as providers
from app.models.support import AuditLog
from app.models.user import User

router = APIRouter(tags=["payouts"])


@router.get("/payouts/me")
async def my_payouts(
    user: User = Depends(require_role(Role.PROVIDER)),
    session: AsyncSession = Depends(get_session),
):
    provider = await providers.get_provider_for_user(session, user.id)
    if provider is None:
        raise NotFoundError("Provider profile not found")
    ready = await engagement.list_ready_payouts(session)
    mine = [p for p in ready if p.provider_id == provider.id]
    return {
        "items": [
            {
                "id": p.id,
                "booking_id": p.booking_id,
                "amount_inr": p.amount_inr,
                "status": p.status,
                "ready_at": p.ready_at,
            }
            for p in mine
        ]
    }


@router.post("/admin/payouts/{payout_id}/mark-paid")
async def mark_paid(
    payout_id: int,
    payload: dict,
    user: User = Depends(require_role(Role.ADMIN)),
    session: AsyncSession = Depends(get_session),
):
    from app.models.payment import Payout

    payout = await session.get(Payout, payout_id)
    if payout is None:
        raise NotFoundError("Payout not found")
    payout.status = "paid"
    payout.paid_at = datetime.utcnow()
    payout.transfer_ref = str(payload.get("transfer_ref", ""))
    await engagement.add_audit(
        session,
        AuditLog(
            actor_user_id=user.id,
            actor_role=user.role.value,
            entity_type="payout",
            entity_id=payout.id,
            action="payout.marked_paid",
            meta={"transfer_ref": payout.transfer_ref},
        ),
    )
    await session.commit()
    return {"id": payout.id, "status": payout.status}
