"""In-app messaging + masked calling. Anti-bypass flags (never silent blocks)."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.communication import CommunicationEvent, FlagSeverity
from app.models.support import AuditLog
from app.repositories import engagement_repository as engagement
from app.services.anti_bypass_service import scan_message


async def get_or_create_thread(session: AsyncSession, booking_id: int):
    thread = await engagement.get_thread_for_booking(session, booking_id)
    if thread is None:
        thread = await engagement.create_thread(session, booking_id)
    return thread


async def post_message(
    session: AsyncSession,
    *,
    booking_id: int,
    sender_user_id: int,
    author_name: str,
    text: str,
) -> CommunicationEvent:
    thread = await get_or_create_thread(session, booking_id)
    scan = scan_message(text)
    event = await engagement.add_event(
        session,
        CommunicationEvent(
            thread_id=thread.id,
            sender_user_id=sender_user_id,
            author_name=author_name,
            body=scan.scrubbed,
            flagged=scan.flagged,
            flag_severity=FlagSeverity(scan.severity) if scan.severity else None,
            flag_patterns=scan.patterns,
        ),
    )
    if scan.flagged:
        # Support review queue — flagged, NOT blocked.
        await engagement.add_audit(
            session,
            AuditLog(
                actor_user_id=sender_user_id,
                actor_role="system",
                entity_type="communication_event",
                entity_id=event.id,
                action="anti_bypass.flagged",
                meta={"severity": scan.severity, "patterns": scan.patterns},
            ),
        )
    return event
