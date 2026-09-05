"""Data access for comms, payments, payouts, tickets, incidents, packages, audit.

IMPORTANT (anti-bypass): audit_logs is INSERT-ONLY. This module intentionally
exposes no update/delete for AuditLog; DB-level REVOKE is staged in migrations.
"""

from __future__ import annotations

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.care_plan import CarePackage, CarePlanSubscription
from app.models.communication import (
    CommunicationEvent,
    CommunicationThread,
    NotificationRecord,
)
from app.models.payment import Payment, Payout
from app.models.support import AuditLog, Incident, Ticket


async def get_thread_for_booking(
    session: AsyncSession, booking_id: int
) -> CommunicationThread | None:
    res = await session.execute(
        select(CommunicationThread).where(CommunicationThread.booking_id == booking_id)
    )
    return res.scalar_one_or_none()


async def create_thread(session: AsyncSession, booking_id: int) -> CommunicationThread:
    thread = CommunicationThread(booking_id=booking_id)
    session.add(thread)
    await session.flush()
    return thread


async def add_event(session: AsyncSession, event: CommunicationEvent) -> CommunicationEvent:
    session.add(event)
    await session.flush()
    return event


async def list_events(session: AsyncSession, thread_id: int) -> list[CommunicationEvent]:
    res = await session.execute(
        select(CommunicationEvent)
        .where(CommunicationEvent.thread_id == thread_id)
        .order_by(CommunicationEvent.id)
    )
    return list(res.scalars())


async def list_flagged_events(session: AsyncSession) -> list[CommunicationEvent]:
    res = await session.execute(
        select(CommunicationEvent)
        .where(CommunicationEvent.flagged.is_(True), CommunicationEvent.reviewed_at.is_(None))
        .order_by(desc(CommunicationEvent.id))
    )
    return list(res.scalars())


async def add_notification(session: AsyncSession, record: NotificationRecord) -> NotificationRecord:
    session.add(record)
    await session.flush()
    return record


async def add_payment(session: AsyncSession, payment: Payment) -> Payment:
    session.add(payment)
    await session.flush()
    return payment


async def get_payment(session: AsyncSession, payment_id: int) -> Payment | None:
    return await session.get(Payment, payment_id)


async def get_payout_for_booking(session: AsyncSession, booking_id: int) -> Payout | None:
    res = await session.execute(select(Payout).where(Payout.booking_id == booking_id))
    return res.scalar_one_or_none()


async def add_payout(session: AsyncSession, payout: Payout) -> Payout:
    session.add(payout)
    await session.flush()
    return payout


async def list_ready_payouts(session: AsyncSession) -> list[Payout]:
    res = await session.execute(select(Payout).where(Payout.status == "payout_ready"))
    return list(res.scalars())


async def add_ticket(session: AsyncSession, ticket: Ticket) -> Ticket:
    session.add(ticket)
    await session.flush()
    return ticket


async def list_tickets(session: AsyncSession, user_id: int | None = None) -> list[Ticket]:
    stmt = select(Ticket).order_by(desc(Ticket.id))
    if user_id is not None:
        stmt = stmt.where(Ticket.user_id == user_id)
    res = await session.execute(stmt)
    return list(res.scalars())


async def add_incident(session: AsyncSession, incident: Incident) -> Incident:
    session.add(incident)
    await session.flush()
    return incident


async def list_incidents(session: AsyncSession) -> list[Incident]:
    res = await session.execute(select(Incident).order_by(desc(Incident.id)))
    return list(res.scalars())


async def add_audit(session: AsyncSession, entry: AuditLog) -> AuditLog:
    """The ONLY way audit rows are written. No update/delete exists — by design."""
    session.add(entry)
    await session.flush()
    return entry


async def list_audit_for_entity(
    session: AsyncSession, entity_type: str, entity_id: int
) -> list[AuditLog]:
    res = await session.execute(
        select(AuditLog)
        .where(AuditLog.entity_type == entity_type, AuditLog.entity_id == entity_id)
        .order_by(AuditLog.id)
    )
    return list(res.scalars())


async def audit_counts(session: AsyncSession) -> dict:
    res = await session.execute(
        select(AuditLog.entity_type, func.count()).group_by(AuditLog.entity_type)
    )
    return {row[0]: row[1] for row in res.all()}


async def list_packages(session: AsyncSession) -> list[CarePackage]:
    res = await session.execute(select(CarePackage).where(CarePackage.active.is_(True)))
    return list(res.scalars())


async def get_package(session: AsyncSession, package_id: int) -> CarePackage | None:
    return await session.get(CarePackage, package_id)


async def add_subscription(session: AsyncSession, sub: CarePlanSubscription) -> CarePlanSubscription:
    session.add(sub)
    await session.flush()
    return sub


async def active_subscription_ids(session: AsyncSession, patient_id: int) -> set[int]:
    res = await session.execute(
        select(CarePlanSubscription.package_id).where(
            CarePlanSubscription.patient_id == patient_id,
            CarePlanSubscription.status == "active",
        )
    )
    return {r for (r,) in res.all()}
