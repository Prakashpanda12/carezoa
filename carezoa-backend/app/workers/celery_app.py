"""Celery app + background jobs: payouts, notifications, credential reminders, plan recurrence."""

from __future__ import annotations

import asyncio
from datetime import datetime, timedelta

from celery import Celery
from celery.schedules import crontab

from app.core.config import get_settings
from app.core.logging import get_logger
from app.db.session import SessionFactory
from app.repositories import engagement_repository as engagement

log = get_logger(__name__)
settings = get_settings()

celery = Celery(
    "carezoa",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
)

celery.conf.beat_schedule = {
    "process-payouts-hourly": {"task": "app.workers.celery_app.process_payouts", "schedule": crontab(minute=15)},
    "credential-reminders-daily": {"task": "app.workers.celery_app.credential_reminders", "schedule": crontab(hour=9, minute=0)},
    "careplan-recurrences-daily": {"task": "app.workers.celery_app.generate_careplan_recurrences", "schedule": crontab(hour=6, minute=30)},
}


@celery.task(name="app.workers.celery_app.dispatch_notification")
def dispatch_notification(record_id: int) -> str:
    from app.integrations.notifications import SENDERS
    from app.models.communication import NotificationRecord

    async def _run() -> str:
        async with SessionFactory() as session:
            record = await session.get(NotificationRecord, record_id)
            if record is None:
                return "missing"
            sender = SENDERS.get(record.channel)
            if sender is None:
                record.status = "unsupported"
            else:
                sender.send(to_user_id=record.user_id, template=record.template, payload=record.payload)
                record.status = "sent"
                record.sent_at = datetime.utcnow()
            await session.commit()
            return record.status

    return asyncio.run(_run())


@celery.task(name="app.workers.celery_app.process_payouts")
def process_payouts() -> str:
    """Worker-side payout batch: moves PAYOUT_READY → PROCESSING for gateway transfer."""

    async def _run() -> str:
        async with SessionFactory() as session:
            rows = await engagement.list_ready_payouts(session)
            for payout in rows:
                payout.status = "processing"
            await session.commit()
            return f"processing:{len(rows)}"

    return asyncio.run(_run())


@celery.task(name="app.workers.celery_app.credential_reminders")
def credential_reminders() -> str:
    log.info("credential_reminders_tick")
    return "ok"


@celery.task(name="app.workers.celery_app.generate_careplan_recurrences")
def generate_careplan_recurrences() -> str:
    async def _run() -> str:
        async with SessionFactory() as session:
            from sqlalchemy import select

            from app.models.care_plan import CarePlanOccurrence, CarePlanSubscription

            horizon = datetime.utcnow() + timedelta(days=7)
            rows = (
                await session.execute(
                    select(CarePlanSubscription).where(
                        CarePlanSubscription.status == "active",
                        CarePlanSubscription.current_period_end <= horizon,
                    )
                )
            ).scalars().all()
            for sub in rows:
                session.add(
                    CarePlanOccurrence(
                        subscription_id=sub.id,
                        scheduled_for=sub.current_period_end or horizon,
                        generated=False,
                    )
                )
            await session.commit()
            return f"generated:{len(rows)}"

    return asyncio.run(_run())
