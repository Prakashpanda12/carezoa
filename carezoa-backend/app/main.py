"""FastAPI app factory: logging, exception mapping, router mounting, /docs."""

from fastapi import FastAPI

from app.api.v1.routers import (
    admin,
    analytics,
    auth,
    availability,
    bookings,
    care_plans,
    communication,
    family,
    incidents,
    patients,
    payments,
    payouts,
    providers,
    ratings,
    search,
    services_catalog,
    support,
    verification,
    visits,
)
from app.core.config import get_settings
from app.core.exceptions import DomainError, domain_error_handler, unexpected_error_handler
from app.core.logging import configure_logging, get_logger


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging()
    log = get_logger(__name__)

    app = FastAPI(
        title="CAREZOA API",
        version="0.1.0",
        docs_url="/docs",
        openapi_url="/openapi.json",
    )

    app.add_exception_handler(DomainError, domain_error_handler)
    app.add_exception_handler(Exception, unexpected_error_handler)

    try:  # OpenTelemetry tracing — soft integration
        from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

        FastAPIInstrumentor.instrument_app(app)
    except Exception:
        log.info("otel_unavailable")

    routers = [
        auth.router,
        patients.router,
        providers.router,
        verification.router,
        services_catalog.router,
        availability.router,
        search.router,
        bookings.router,
        payments.router,
        payouts.router,
        visits.router,
        care_plans.router,
        family.router,
        ratings.router,
        communication.router,
        support.router,
        incidents.router,
        admin.router,
        analytics.router,
    ]
    for r in routers:
        app.include_router(r, prefix=settings.api_v1_prefix)

    @app.get(f"{settings.api_v1_prefix}/health")
    async def health() -> dict:
        return {"status": "ok", "service": settings.app_name, "version": "0.1.0"}

    log.info("app_ready", env=settings.app_env)
    return app


app = create_app()
