"""Notification dispatch — writes the durable record, then best-effort enqueue to workers."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.models.communication import NotificationRecord
from app.repositories import engagement_repository as engagement

log = get_logger(__name__)


async def notify(
    session: AsyncSession,
    *,
    user_id: int,
    channel: str,
    template: str,
    payload: dict,
) -> NotificationRecord:
    record = await engagement.add_notification(
        session,
        NotificationRecord(
            user_id=user_id, channel=channel, template=template, payload=payload
        ),
    )
    try:  # queue the background dispatcher; tolerate broker absence in tests/dev
        from app.workers.celery_app import dispatch_notification

        dispatch_notification.delay(record.id)
    except Exception:
        log.info("notification_inline_fallback", template=template, record_id=record.id)
    return record
