from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user
from app.db.session import get_session
from app.models.support import Ticket
from app.models.user import User
from app.repositories import engagement_repository as engagement
from app.schemas.booking import TicketIn, TicketOut

router = APIRouter(prefix="/support", tags=["support"])


@router.get("/tickets", response_model=list[TicketOut])
async def my_tickets(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    rows = await engagement.list_tickets(session, user_id=user.id)
    return [
        TicketOut(id=t.id, subject=t.subject, status=t.status.value, created_at=t.created_at)
        for t in rows
    ]


@router.post("/tickets", response_model=TicketOut, status_code=201)
async def create_ticket(
    payload: TicketIn,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    ticket = await engagement.add_ticket(
        session, Ticket(user_id=user.id, subject=payload.subject, body=payload.body)
    )
    await session.commit()
    return TicketOut(
        id=ticket.id, subject=ticket.subject, status=ticket.status.value, created_at=ticket.created_at
    )
