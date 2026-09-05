"""Import all models so Alembic autogenerate sees the full metadata."""
from app.models.user import User  # noqa: F401
from app.models.patient import FamilyMember, PatientProfile  # noqa: F401
from app.models.catalog import Service  # noqa: F401
from app.models.provider import (  # noqa: F401
    Provider,
    ProviderAvailability,
    ProviderCredential,
    ProviderServiceOffering,
)
from app.models.booking import (  # noqa: F401
    Booking,
    OtpChallenge,
    Review,
    ServiceReport,
)
from app.models.payment import Payment, PaymentEvent, PaymentMethod, Payout  # noqa: F401
from app.models.communication import (  # noqa: F401
    CommunicationEvent,
    CommunicationThread,
    NotificationRecord,
)
from app.models.support import AuditLog, Incident, Ticket  # noqa: F401
from app.models.care_plan import (  # noqa: F401
    CarePackage,
    CarePlanOccurrence,
    CarePlanSubscription,
)
