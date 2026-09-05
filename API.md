# CAREZOA API Contract — `/api/v1` (mock/dev backend)

The Expo patient app consumes **only** this contract — never the database.
A machine-readable copy lives at `GET /api/v1/docs`. All routes are implemented
in `src/app/api/v1/*` (Next.js route handlers over PostgreSQL/Drizzle).

## Conventions

- **Base:** `http://localhost:3000/api/v1` (local) — via `EXPO_PUBLIC_API_URL`
- **Auth:** `Authorization: Bearer cz_<patientId>_<secret>` from OTP verify.
  The mock accepts token-less requests as patient `1` for development.
- **Errors:** `{ "error": "message" }` with a 4xx/5xx status.
- **Anti-bypass invariants (enforced server-side):**
  - Provider payloads **never** contain `phone` / `email` / social handles.
  - Chat bodies are scrubbed of contact patterns in **both** directions on write.
  - Masked calls return a short-lived **relay** number, never a real one.
  - `checkinOtp` is returned to the **family** app only, display-only, shared verbally at the door.

## Auth

| Method | Path | Body → Returns |
|---|---|---|
| POST | `/auth/otp/request` | `{phone}` → `{requestId, expiresInSec, devCode}` (sandbox returns the code: `123456`) |
| POST | `/auth/otp/verify` | `{phone, code}` → `{token, isNewUser, patient}` |
| GET | `/profile` | → `patient` |
| PATCH | `/profile` | `{name?, dob?, gender?, city?, address?}` → `patient` |

## Catalog & providers

| Method | Path | Notes |
|---|---|---|
| GET | `/services` | `{categories[], items[]}` — name, durationMin, basePriceInr |
| GET | `/providers?q=&city=` | list with `distanceKm`, `coverageKm`, rating. **No contact fields.** |
| GET | `/providers/:id` | detail + `services[]` offered + masked-Name `reviews[]` |

## Bookings & visit lifecycle

Status flow: `scheduled → confirmed → en_route → checked_in → in_service → completed` (`cancelled` exits). Payment success flips `scheduled→confirmed`.

| Method | Path | Notes |
|---|---|---|
| POST | `/bookings` | create (status `scheduled`, `paymentStatus: unpaid`) |
| GET | `/bookings?scope=upcoming\|past\|all` | hydrated with provider + service |
| GET | `/bookings/:id` | detail + `timeline[]` events + display-only `checkinOtp` |
| PATCH | `/bookings/:id` | `{action: "cancel"}` or `{action: "reschedule", startsAt}` |
| GET | `/bookings/:id/messages` | scrubbed thread |
| POST | `/bookings/:id/messages` | `{body}` → scrubbed; mock provider reply +35s |
| POST | `/calls/masked` | `{bookingId}` → `{maskedNumber, expiresAt}` relay |
| POST | `/sim/advance` | **mock only** — simulates the provider app advancing the lifecycle; completion auto-writes a care record |

## Payments (WebView bridge)

1. `POST /payments` `{bookingId, methodId}` → `{paymentId, checkoutUrl}`
2. App opens `checkoutUrl` (`GET /payments/:id/checkout`) in a **WebView** — hosted sandbox page.
3. The page confirms via `POST /payments/:id` `{result:"success"|"failed"}` and redirects to
   **`carezoa://payment/<result>?bookingId=…&paymentId=…`** — the app intercepts the scheme and routes to success/failure.

## Records, family, packages, support, methods

| Method | Path | Notes |
|---|---|---|
| GET | `/records` | completed-visit reports incl. `vitals{}` |
| GET | `/family` | members + `accessScope{viewVisits,viewRecords,chat}` |
| POST | `/family` | invite `{name, relation, phone, accessScope}` → `pending` |
| PATCH | `/family/:id` | `{action:"revoke"}` / `{action:"simulate_accept"}` (mock) / `{accessScope}` |
| GET | `/packages` | care plans + `subscribed` flag |
| POST | `/packages/:id` | subscribe (mock-billed) |
| GET / POST | `/tickets` | list / create support tickets |
| GET / POST | `/payment-methods` | saved UPI/cards |
| DELETE | `/payment-methods/:id` | remove |

## App-side access gating

Family members see exactly what `accessScope` grants (enforced client-side in
"View as" mode): `visits` ↔ `viewVisits`, `records` ↔ `viewRecords`,
chat entry points ↔ `chat`. The API never returns more than granted.
