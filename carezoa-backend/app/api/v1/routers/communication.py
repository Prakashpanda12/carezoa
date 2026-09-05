"""In-app chat + masked calling. Chat is flagged-not-blocked by anti_bypass_service."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user
from app.core.config import get_settings
from app.db.session import get_session
from app.integrations.masked_telephony import MockTelephonyProvider
from app.models.user import User
from app.repositories import engagement_repository as engagement
from app.schemas.booking import MaskedCallOut, MessageIn, MessageOut
from app.services import communication_service as comms

router = APIRouter(prefix="/bookings", tags=["communication"])
telephony = MockTelephonyProvider()


@router.get("/{booking_id}/messages", response_model=list[MessageOut])
async def list_messages(
    booking_id: int,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    thread = await engagement.get_thread_for_booking(session, booking_id)
    if thread is None:
        return []
    events = await engagement.list_events(session, thread.id)
    return [
        MessageOut(
            id=e.id,
            sender="patient" if e.author_name == "You" else "provider",
            author_name=e.author_name,
            body=e.body,
            flagged=e.flagged,
            created_at=e.created_at,
        )
        for e in events
    ]


@router.post("/{booking_id}/messages", response_model=MessageOut, status_code=201)
async def send_message(
    booking_id: int,
    payload: MessageIn,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    event = await comms.post_message(
        session,
        booking_id=booking_id,
        sender_user_id=user.id,
        author_name="You" if user.role.value == "patient" else user.phone,
        text=payload.body,
    )
    await session.commit()
    return MessageOut(
        id=event.id,
        sender="patient",
        author_name=event.author_name,
        body=event.body,
        flagged=event.flagged,
        created_at=event.created_at,
    )


@router.post("/{booking_id}/masked-call", response_model=MaskedCallOut, status_code=201)
async def masked_call(booking_id: int, _: User = Depends(get_current_user)):
    session = telephony.create_session(booking_id=booking_id)
    _ = get_settings()
    return MaskedCallOut(
        call_id=session.call_id,
        masked_number=session.masked_number,
        expires_at=session.expires_at,
    )
