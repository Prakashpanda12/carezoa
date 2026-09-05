from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user
from app.core.exceptions import GuardFailedError, NotFoundError
from app.db.session import get_session
from app.models.booking import Review
from app.models.user import User
from app.repositories import booking_repository as repo
from app.repositories import provider_repository as providers
from app.schemas.booking import RatingIn
from app.state_machines.booking_state_machine import BookingStatus

router = APIRouter(prefix="/ratings", tags=["ratings"])


@router.post("", status_code=201)
async def rate(
    payload: RatingIn,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    booking = await repo.get_booking(session, payload.booking_id)
    if booking is None:
        raise NotFoundError("Booking not found")
    if booking.status != BookingStatus.COMPLETED:
        raise GuardFailedError("You can only rate completed visits")

    review = await repo.add_review(
        session,
        Review(
            booking_id=booking.id,
            patient_id=booking.patient_id,
            provider_id=booking.provider_id,
            rating=payload.rating,
            text=payload.text,
        ),
    )
    # maintain denormalized aggregate used by the matching algorithm
    provider = await providers.get_provider(session, booking.provider_id)
    if provider is not None:
        total = provider.rating_avg * provider.rating_count + payload.rating
        provider.rating_count += 1
        provider.rating_avg = round(total / provider.rating_count, 3)
    await session.commit()
    return {"review_id": review.id}
