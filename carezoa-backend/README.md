# CAREZOA Backend

Production-grade FastAPI backend for the home-healthcare marketplace
(Python 3.12 · FastAPI · SQLAlchemy 2.0 async · PostgreSQL · Redis · Celery).

> 📖 **New here?** Open [`ARCHITECTURE.html`](./ARCHITECTURE.html) in a
> browser for the full picture with rendered diagrams — folder-by-folder
> walkthrough, the complete Entity-Relationship Diagram (all 22 tables), the
> booking/visit state machine, and every non-negotiable business rule baked
> into the code. ([`ARCHITECTURE.md`](./ARCHITECTURE.md) is the raw
> Markdown source, same content.)

## Local setup

```bash
cd carezoa-backend
cp .env.example .env
docker compose up db redis minio -d        # infra
pip install .
alembic upgrade head                       # schema (app/db/migrations/versions/0001_initial.py)
python -m scripts.seed                     # 10 nurses, 10 patients, bookings in every state
uvicorn app.main:app --reload              # http://localhost:8000/docs
```

One-shot everything (API + worker + beat + infra): `docker compose up --build`.

**Sandbox login:** any phone → OTP `123456` (only when `APP_ENV != prod`).

## Migrations

```bash
alembic upgrade head                       # apply
alembic revision --autogenerate -m "..."   # evolve after changing app/models/
alembic downgrade -1                       # roll back one
```

## Domain map (router → service → repository)

| Domain | Router (`app/api/v1/routers/`) | Service (`app/services/`) | Repository (`app/repositories/`) |
|---|---|---|---|
| Auth (OTP/JWT/refresh) | `auth.py` | `notification_service.py` (SMS OTP) | `identity_repository.py` |
| Patient profile | `patients.py` | — | `identity_repository.py` |
| Provider directory | `providers.py` | — | `provider_repository.py` |
| Credential verification | `verification.py` | `verification_service.py` | `provider_repository.py` |
| Service catalogue | `services_catalog.py` | — | `provider_repository.py` |
| Availability | `availability.py` | — | `provider_repository.py` |
| Search + matching | `search.py` | `matching_service.py` (pure) | `provider_repository.py` |
| Booking engine + lifecycle | `bookings.py` | `booking_service.py` → `state_machines/booking_state_machine.py` (pure, exclusive) | `booking_repository.py` |
| Payments + webhooks | `payments.py` | `payment_service.py` | `engagement_repository.py` |
| Payouts | `payouts.py` | report→payout in `booking_service.py` | `engagement_repository.py` |
| Visits + care reports/records | `visits.py` | `booking_service.submit_service_report` | `booking_repository.py` |
| Care plans | `care_plans.py` | recurrence worker | `engagement_repository.py` |
| Family members | `family.py` | — | `identity_repository.py` |
| Ratings | `ratings.py` | — | `booking_repository.py` |
| Chat + masked call | `communication.py` | `communication_service.py` + `anti_bypass_service.py` (pure) | `engagement_repository.py` |
| Support tickets | `support.py` | — | `engagement_repository.py` |
| Incidents | `incidents.py` | state machine `INCIDENT_RAISED` | `engagement_repository.py` |
| Admin (flags, audit) | `admin.py` | — | `engagement_repository.py` |
| Analytics | `analytics.py` | — | `engagement_repository.py` |

Integrations (`app/integrations/`): `payment_gateway.py` (adapter + sandbox,
HMAC-verified webhooks), `masked_telephony.py` (relay-only mock),
`notifications.py` (sms/whatsapp/push adapters), `maps.py` (haversine),
`storage.py` (S3 signed URLs — never raw creds). Workers
(`app/workers/celery_app.py`): payout batch, notification dispatch,
credential reminders, care-plan recurrence.

## Non-negotiables (in code, tested)

- **Booking state machine** — pure stdlib (`app/state_machines/booking_state_machine.py`),
  called ONLY from `booking_service.apply_event`. Every transition writes an
  `audit_logs` row; audit rows are insert-only (repository exposes no update/delete;
  migration 0001 additionally REVOKEs UPDATE/DELETE).
- **Anti-bypass** — all chat persisted to `communication_events`; scanner
  (`app/services/anti_bypass_service.py`) flags (not blocks) contact-sharing
  patterns for the support queue, and stored bodies are scrubbed. Calls only
  via masked-telephony adapter (relay numbers). No counterparty contact fields
  in any response.
- **Payouts** — exclusively `REPORT_SUBMITTED → PAYOUT_READY`
  (`booking_service.submit_service_report`); never manual off-platform marks.
- **Matching** — hard gates (service/verification/availability/coverage) then
  weighted score; price = lowest weight (0.06), never a price-only sort.
- **Security** — `require_role()` on every route, admin routes need MFA-issued
  tokens (`require_admin_mfa`), rate-limited auth/OTP, webhook signature
  verification, Pydantic-validated inputs, PII-stripped logs.

## Tests

```bash
pytest                        # full suite
python -m unittest discover -s app/tests/unit   # pure-logic subset (28 tests)
```

- `unit/test_booking_state_machine.py` — happy path + every exception state
- `unit/test_matching_service.py` — gates + ranking + anti-price-sort
- `unit/test_anti_bypass_service.py` — patterns/severity/scrub
- `integration/test_auth_and_rbac.py` — OTP flow, wrong-code, RBAC denial
- `integration/test_payment_webhook.py` — bad signature, idempotency, state effect
