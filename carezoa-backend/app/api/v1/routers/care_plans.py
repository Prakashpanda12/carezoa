from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user
from app.core.exceptions import NotFoundError
from app.db.session import get_session
from app.models.care_plan import CarePlanSubscription
from app.models.user import User
from app.repositories import engagement_repository as engagement
from app.repositories import identity_repository as identity
from app.schemas.booking import PackageOut

router = APIRouter(prefix="/care-plans", tags=["care_plans"])


@router.get("", response_model=list[PackageOut])
async def packages(user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    profile = await identity.get_patient_by_user(session, user.id)
    active = await engagement.active_subscription_ids(session, profile.id) if profile else set()
    plans = await engagement.list_packages(session)
    return [
        PackageOut(
            id=p.id,
            name=p.name,
            description=p.description,
            visits_per_month=p.visits_per_month,
            price_per_month_inr=p.price_per_month_inr,
            includes=p.includes,
            best_for=p.best_for,
            subscribed=p.id in active,
        )
        for p in plans
    ]


@router.post("/{package_id}/subscribe", status_code=201)
async def subscribe(
    package_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    package = await engagement.get_package(session, package_id)
    if package is None:
        raise NotFoundError("Plan not found")
    profile = await identity.get_patient_by_user(session, user.id)
    if profile is None:
        raise NotFoundError("Patient profile not found")
    sub = await engagement.add_subscription(
        session,
        CarePlanSubscription(patient_id=profile.id, package_id=package_id, status="active"),
    )
    await session.commit()
    return {"subscription_id": sub.id, "status": sub.status}
