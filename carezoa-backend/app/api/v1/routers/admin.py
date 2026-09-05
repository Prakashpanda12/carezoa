"""Admin console: anti-bypass review queue + insert-only audit inspection."""

from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import require_admin_mfa
from app.db.session import get_session
from app.models.user import User
from app.repositories import engagement_repository as engagement

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/flagged-events")
async def flagged(
    _: User = Depends(require_admin_mfa),
    session: AsyncSession = Depends(get_session),
):
    events = await engagement.list_flagged_events(session)
    return {
        "items": [
            {
                "id": e.id,
                "thread_id": e.thread_id,
                "severity": e.flag_severity.value if e.flag_severity else None,
                "patterns": e.flag_patterns,
                "body": e.body,
                "created_at": e.created_at,
            }
            for e in events
        ]
    }


@router.post("/flagged-events/{event_id}/review")
async def review_flagged(
    event_id: int,
    payload: dict,
    user: User = Depends(require_admin_mfa),
    session: AsyncSession = Depends(get_session),
):
    from app.models.communication import CommunicationEvent

    event = await session.get(CommunicationEvent, event_id)
    if event is None:
        return {"reviewed": False, "reason": "not_found"}
    event.reviewed_by = user.id
    event.reviewed_at = datetime.utcnow()
    await session.commit()
    return {"reviewed": True, "outcome": payload.get("outcome", "dismissed")}


@router.get("/audit")
async def audit(
    entity_type: str = Query(...),
    entity_id: int = Query(...),
    _: User = Depends(require_admin_mfa),
    session: AsyncSession = Depends(get_session),
):
    rows = await engagement.list_audit_for_entity(session, entity_type, entity_id)
    return {
        "items": [
            {
                "id": a.id,
                "actor_role": a.actor_role,
                "action": a.action,
                "from_state": a.from_state,
                "to_state": a.to_state,
                "meta": a.meta,
                "created_at": a.created_at,
            }
            for a in rows
        ]
    }
