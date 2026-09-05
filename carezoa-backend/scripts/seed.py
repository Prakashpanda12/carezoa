"""
Demo seed: 10 nurses, 10 patients, service catalogue, bookings in EVERY state,
a completed visit with report+payout, flagged chat sample, care packages.

Run:  python -m scripts.seed   (from carezoa-backend/, with DATABASE_URL set)
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timedelta

from sqlalchemy import func, select

from app.core.security import Role
from app.db.session import SessionFactory
from app.models.booking import Booking, Review, ServiceReport
from app.models.catalog import Service
from app.models.care_plan import CarePackage
from app.models.communication import CommunicationEvent, CommunicationThread
from app.models.patient import PatientProfile
from app.models.payment import GatewayPaymentStatus, Payment, Payout, PayoutStatus
from app.models.provider import Provider, ProviderAvailability, ProviderServiceOffering, VerificationStatus
from app.models.support import AuditLog
from app.models.user import User
from app.state_machines.booking_state_machine import BookingStatus, PaymentStatus

NOW = datetime.utcnow


def h(hours: float) -> datetime:
    return NOW() + timedelta(hours=hours)


SERVICES = [
    ("Nursing", "Home Nursing Visit", "Registered nurse home visit.", 60, 799, "medkit"),
    ("Elder Care", "Elder Companion Care", "Attendant companionship + routine.", 180, 1199, "heart"),
    ("Recovery", "Post-Surgery Care", "Structured post-op visits.", 90, 1499, "bandage"),
    ("Recovery", "Physiotherapy Session", "Licensed physio at home.", 45, 999, "walk"),
    ("Procedures", "Injection / IV at Home", "Safe injectables at home.", 30, 499, "eyedrop"),
    ("Elder Care", "Attendant — Day Shift", "12-hour attendant shift.", 720, 1899, "people"),
]

NURSES = [
    ("Suresh Patra", "Critical Care Nurse", 9, 4.9, 132, (20.3525, 85.8194), 15, 0.97, 0.01),
    ("Anita Das", "Elder Care Specialist", 7, 4.8, 98, (20.3311, 85.8345), 12, 0.95, 0.02),
    ("Priyanka Sahoo", "Post-Op Recovery Nurse", 6, 4.9, 76, (20.2961, 85.8245), 18, 0.96, 0.01),
    ("Ramesh Behera", "Physiotherapist", 11, 4.7, 210, (20.4625, 85.8830), 25, 0.92, 0.04),
    ("Kavita Mishra", "Procedures Nurse", 5, 4.6, 54, (20.3152, 85.8085), 10, 0.9, 0.05),
    ("Debasish Lenka", "ICU Nurse", 8, 4.8, 140, (20.3402, 85.8097), 20, 0.94, 0.03),
    ("Subhasree Nayak", "Geriatric Nurse", 12, 4.8, 88, (30.3165, 78.0322), 15, 0.93, 0.02),
    ("Bikram Sahu", "Home Care Attendant", 4, 4.5, 41, (20.3481, 85.8420), 12, 0.88, 0.06),
    ("Rita Mohapatra", "Pediatric Home Nurse", 6, 4.7, 63, (20.3205, 85.8170), 14, 0.91, 0.03),
    ("Manas Pradhan", "Rehab Specialist", 10, 4.6, 77, (20.3010, 85.8392), 22, 0.9, 0.04),
]

PATIENTS = [
    "Maya Mohanty", "Rohit Jena", "Sulochana Das", "Biren Mohanty", "Anu Sharma",
    "Prakash Sahoo", "Lina Tripathy", "Daniel D'Souza", "Farah Khan", "Gopal Behera",
]

OFFER_MAP = {
    "Critical Care Nurse": [0, 2, 4], "Elder Care Specialist": [1, 5],
    "Post-Op Recovery Nurse": [0, 2], "Physiotherapist": [3],
    "Procedures Nurse": [0, 4], "ICU Nurse": [0, 2],
    "Geriatric Nurse": [0, 1, 5], "Home Care Attendant": [1, 5],
    "Pediatric Home Nurse": [0], "Rehab Specialist": [2, 3],
}


async def seed() -> None:
    async with SessionFactory() as s:
        if (await s.execute(select(func.count()).select_from(User))).scalar_one() > 0:
            print("already seeded")
            return

        # Create admin user
        admin_user = User(phone="+919999999999", role=Role.ADMIN, mfa_enabled=True)
        s.add(admin_user)
        
        # Create support agent user
        support_user = User(phone="+919999999998", role=Role.SUPPORT_AGENT, mfa_enabled=False)
        s.add(support_user)
        
        await s.flush()
        print(f"Created admin user: {admin_user.phone}")
        print(f"Created support agent: {support_user.phone}")

        services = [
            Service(category=c, name=n, description=d, duration_min=du, base_price_inr=p, icon=i)
            for c, n, d, du, p, i in SERVICES
        ]
        s.add_all(services)
        await s.flush()

        patient_profiles: list[PatientProfile] = []
        for i, name in enumerate(PATIENTS):
            user = User(phone=f"+9194370000{i:02d}", role=Role.PATIENT)
            s.add(user)
            await s.flush()
            profile = PatientProfile(
                user_id=user.id,
                name=name,
                dob="14/09/1971",
                gender="F" if i % 2 == 0 else "M",
                city="Bhubaneswar",
                address=f"{i + 11} Lakeview Lane, Patia",
                lat=20.3525,
                lng=85.8305,
                onboarding_done=True,
            )
            s.add(profile)
            patient_profiles.append(profile)
        await s.flush()

        providers: list[Provider] = []
        for i, (name, title, years, rating, count, (lat, lng), cov, acc, canc) in enumerate(NURSES):
            user = User(phone=f"+9194470000{i:02d}", role=Role.PROVIDER)
            s.add(user)
            await s.flush()
            provider = Provider(
                user_id=user.id,
                display_name=name,
                title=title,
                qualifications=["Registered"],
                languages=["Odia", "Hindi"],
                city="Bhubaneswar",
                lat=lat,
                lng=lng,
                coverage_km=cov,
                years_exp=years,
                rating_avg=rating,
                rating_count=count,
                acceptance_rate=acc,
                cancellation_rate=canc,
                verification_status=VerificationStatus.VERIFIED if i < 8 else VerificationStatus.PENDING_REVIEW,
                bio=f"{title} serving Bhubaneswar for {years} years.",
            )
            s.add(provider)
            providers.append(provider)
        await s.flush()

        for provider in providers:
            for svc_idx in OFFER_MAP.get(provider.title, [0]):
                s.add(
                    ProviderServiceOffering(
                        provider_id=provider.id,
                        service_id=services[svc_idx].id,
                        price_inr=services[svc_idx].base_price_inr,
                    )
                )
            for weekday in range(0, 6):
                s.add(
                    ProviderAvailability(
                        provider_id=provider.id, weekday=weekday, start_min=7 * 60, end_min=20 * 60
                    )
                )
        await s.flush()

        # ---- bookings in every state --------------------------------------
        def mk(idx: int, status: BookingStatus, start: datetime, **kw) -> Booking:
            provider = providers[idx % len(providers)]
            svc = services[idx % len(services)]
            return Booking(
                patient_id=patient_profiles[idx % len(patient_profiles)].id,
                provider_id=provider.id,
                service_id=svc.id,
                status=status,
                payment_status=(
                    PaymentStatus.UNPAID
                    if status == BookingStatus.PENDING_PAYMENT
                    else PaymentStatus.PAID
                ),
                starts_at=start,
                duration_min=svc.duration_min,
                patient_snapshot={"name": PATIENTS[idx % len(PATIENTS)], "age": 68, "gender": "M"},
                address="Flat 4B, Silver Oak Residency, Patia",
                city="Bhubaneswar",
                amount_inr=svc.base_price_inr,
                **kw,
            )

        s.add_all(
            [
                mk(0, BookingStatus.PENDING_PAYMENT, h(30)),                  # awaiting payment
                mk(1, BookingStatus.CONFIRMED, h(20)),                          # confirmed
                mk(2, BookingStatus.EN_ROUTE, h(0.5), en_route_at=NOW(), checkin_otp="4821"),
                mk(3, BookingStatus.CHECKED_IN, NOW(), en_route_at=h(-1), checked_in_at=NOW(), checkin_otp="9310"),
                mk(4, BookingStatus.IN_SERVICE, NOW(), started_at=NOW(), checkin_otp="1042"),
                mk(
                    5, BookingStatus.COMPLETED, h(-26),
                    en_route_at=h(-28), checked_in_at=h(-27.5), started_at=h(-27), completed_at=h(-25.5),
                ),
                mk(6, BookingStatus.CANCELLED, h(-50), cancel_reason="Family rescheduled"),
                mk(7, BookingStatus.NO_SHOW, h(-70), confirmed_at=h(-96)),
                mk(8, BookingStatus.DISPUTED, NOW(), started_at=h(-1)),
            ]
        )
        await s.flush()

        # completed booking → payment + payout (READY after report) + review + report
        completed = (
            await s.execute(select(Booking).where(Booking.status == BookingStatus.COMPLETED).limit(1))
        ).scalar_one()
        payment = Payment(booking_id=completed.id, amount_inr=completed.amount_inr, status=GatewayPaymentStatus.SUCCESS)
        s.add(payment)
        await s.flush()
        s.add(
            ServiceReport(
                booking_id=completed.id,
                summary="Vitals stable, medication schedule reviewed with the family.",
                vitals={"BP": "126/82", "Pulse": "76", "SpO2": "98%"},
                notes="Next visit in 3 days.",
            )
        )
        s.add(
            Payout(
                provider_id=completed.provider_id,
                booking_id=completed.id,
                amount_inr=int(completed.amount_inr * 0.85),
                platform_fee_inr=int(completed.amount_inr * 0.15),
                status=PayoutStatus.READY,
                ready_at=NOW(),
            )
        )
        s.add(
            Review(
                booking_id=completed.id,
                patient_id=completed.patient_id,
                provider_id=completed.provider_id,
                rating=5,
                text="Wonderful nurse, very punctual.",
            )
        )

        # flagged chat sample (anti-bypass review queue)
        thread = CommunicationThread(booking_id=completed.id)
        s.add(thread)
        await s.flush()
        s.add_all(
            [
                CommunicationEvent(
                    thread_id=thread.id, sender_user_id=completed.provider_id or 1,
                    author_name="Nurse", body="I will reach by 9:50 tomorrow.",
                ),
                CommunicationEvent(
                    thread_id=thread.id, sender_user_id=completed.patient_id,
                    author_name="Family", body="call me on [hidden by CAREZOA] directly",
                    flagged=True, flag_patterns=["phone_number"],
                ),
            ]
        )

        s.add_all(
            [
                CarePackage(name="Elder Essentials", description="Companionship + wellness checks.", visits_per_month=8, price_per_month_inr=3999, includes=["4 companion visits", "4 nursing check-ins"], best_for="Independent elders"),
                CarePackage(name="Post-Op Recovery", description="First-month post-surgery pathway.", visits_per_month=10, price_per_month_inr=5499, includes=["6 nursing visits", "2 physio sessions"], best_for="Fresh from discharge"),
                CarePackage(name="Chronic Care Plus", description="Ongoing condition management.", visits_per_month=12, price_per_month_inr=6999, includes=["8 nursing visits", "4 attendant shifts"], best_for="Long-term conditions"),
            ]
        )

        s.add(
            AuditLog(
                actor_user_id=None,
                actor_role="system",
                entity_type="seed",
                entity_id=0,
                action="seed.completed",
                meta={
                    "nurses": len(NURSES),
                    "patients": len(PATIENTS),
                    "admin_phone": "+919999999999",
                    "support_phone": "+919999999998",
                },
            )
        )
        await s.commit()
        print("seeded: 10 nurses, 10 patients, 9 bookings across every state")
        print("admin login: +919999999999 (OTP: 123456 in dev)")
        print("support login: +919999999998 (OTP: 123456 in dev)")


if __name__ == "__main__":
    asyncio.run(seed())
