# Carezoa Admin Console

> **Internal operations tool** for the Carezoa home-healthcare marketplace — provider verification, booking oversight, payments/refunds, quality and fraud monitoring, and support escalation.

Built with **React 18 + TypeScript + Vite**, integrated with the `carezoa-backend` FastAPI service.

---

## 🏗 Architecture

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Server State | TanStack Query (react-query) |
| Data Tables | TanStack Table |
| Routing | React Router with RBAC guards |
| Styling | Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Testing | Vitest + React Testing Library |

---

## 📁 Folder Structure

```
carezoa-admin-web/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── .env.example
└── src/
    ├── main.tsx                         # Entry point
    ├── index.css                        # Tailwind + shadcn CSS variables
    ├── vite-env.d.ts
    ├── routes/
    │   └── index.tsx                    # Route config + RBAC guards
    ├── layouts/
    │   └── AppShell.tsx                 # Sidebar nav + role-based menu
    ├── lib/
    │   ├── api.ts                       # Axios client + auth interceptors
    │   ├── auth.tsx                     # Auth context provider
    │   └── utils.ts                     # cn(), formatting helpers
    ├── types/
    │   └── index.ts                     # All TypeScript types
    ├── hooks/
    ├── components/
    │   ├── ui/                          # shadcn-based primitives
    │   │   ├── button.tsx
    │   │   ├── badge.tsx
    │   │   ├── card.tsx
    │   │   ├── dialog.tsx
    │   │   ├── input.tsx
    │   │   ├── label.tsx
    │   │   ├── select.tsx
    │   │   ├── spinner.tsx
    │   │   ├── table.tsx
    │   │   └── tabs.tsx
    │   ├── tables/
    │   │   └── DataTable.tsx            # Reusable TanStack Table wrapper
    │   └── charts/
    │       └── index.tsx                # Recharts wrappers
    ├── features/
    │   ├── bookings/
    │   ├── verification/
    │   ├── fraud/
    │   ├── payments/
    │   ├── support/
    │   └── analytics/
    └── pages/
        ├── LoginPage.tsx
        ├── overview/
        │   └── AnalyticsDashboard.tsx
        ├── providers/
        │   ├── ProviderApplications.tsx
        │   ├── CredentialVerification.tsx
        │   └── ProviderQuality.tsx
        ├── marketplace/
        │   ├── BookingsPage.tsx
        │   ├── LiveServiceStatus.tsx
        │   ├── ServiceCatalogue.tsx
        │   └── GeographicCoverage.tsx
        ├── finance/
        │   └── PaymentsRefundsPayouts.tsx
        ├── trust/
        │   ├── ComplaintsIncidents.tsx
        │   ├── FraudBypassFlags.tsx
        │   └── CustomerSupport.tsx
        └── admin/
            ├── RolesPermissions.tsx
            └── AuditLogViewer.tsx
```

---

## 📱 Pages (13 total)

### Overview
| Page | Description |
|---|---|
| `AnalyticsDashboard` | Bookings, GMV, net revenue, active patients/nurses, utilization, fill rate, cancellation/no-show rate, completion rate |

### Provider Ops
| Page | Description |
|---|---|
| `ProviderApplications` | Queue + detail view of all providers |
| `CredentialVerification` | Document viewer + approve/reject/expire with reason capture |
| `ProviderQuality` | Scorecard: on-time arrival, acceptance rate, cancellation rate, rating, complaint rate, report completion, repeat-booking rate, incident rate |

### Marketplace Ops
| Page | Description |
|---|---|
| `Bookings` | Searchable/filterable table + detail drawer with full state machine history |
| `LiveServiceStatus` | Bookings currently EN_ROUTE/CHECKED_IN/IN_SERVICE (auto-refresh) |
| `ServiceCatalogue` | CRUD for catalog items + eligibility rules |
| `GeographicCoverage` | Map of active service areas vs demand |

### Finance
| Page | Description |
|---|---|
| `PaymentsRefundsPayouts` | Transaction table, refund action with reason + audit trail, payout batch status |

### Trust & Safety
| Page | Description |
|---|---|
| `ComplaintsIncidents` | Queue with severity/escalation path |
| `FraudBypassFlags` | Communication events flagged by anti_bypass_service, with reviewer actions |
| `CustomerSupport` | Ticket queue |

### Admin
| Page | Description |
|---|---|
| `RolesPermissions` | RBAC management for support_agent/admin accounts |
| `AuditLogViewer` | Read-only, filterable by actor/entity/action |

---

## 🔒 Operational Safety

### Every destructive or high-impact action requires:
1. **Reason field** — Mandatory explanation
2. **Confirmation step** — Dialog with explicit confirmation button
3. **Audit trail** — All actions call endpoints that write to `audit_logs`

### Specific Guards:
- **CredentialVerification** — Blocks "approve" if required document field is missing or expired
- **FraudBypassFlags** — Message content hidden by default; reviewer must explicitly expand; all reviews logged
- **PaymentsRefundsPayouts** — Mark-paid requires transfer reference; recorded in audit log
- **Provider suspension** — Requires reason + confirmation

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
cd carezoa-admin-web
npm install
```

### Environment Variables

Copy `.env.example` to `.env`:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

### Run the App

```bash
npm run dev
```

The app will be available at `http://localhost:3001`.

### Connect to Backend

1. Start the backend:
   ```bash
   cd ../carezoa-backend
   docker compose up db redis minio -d
   uvicorn app.main:app --reload
   ```

2. The Vite dev server proxies `/api` requests to `http://localhost:8000` automatically.

3. **Sandbox login**: Any phone number + OTP `123456` (when `APP_ENV != prod`)
   - Must be an `admin` or `support_agent` user to access the admin console

---

## 🛡 RBAC

| Role | Access |
|---|---|
| `admin` | Full access to all pages |
| `support_agent` | Dashboard, Provider Applications, Provider Quality, Bookings, Live Status, Incidents, Support |

The sidebar navigation is filtered based on the logged-in user's role. Route-level guards prevent unauthorized access even if a URL is typed directly.

---

## 📦 Build for Production

```bash
npm run build
```

Output will be in `dist/`. Serve with any static file server.

---

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with UI
npm run test:ui
```

---

## 🌐 API Integration

The admin console consumes these backend endpoints:

| Domain | Endpoints |
|---|---|
| Auth | `POST /auth/otp/request`, `POST /auth/otp/verify`, `POST /auth/refresh` |
| Analytics | `GET /analytics/overview` |
| Providers | `GET /providers`, `GET /providers/:id` |
| Verification | `POST /admin/credentials/:id/review` |
| Services | `GET /services` |
| Bookings | `GET /bookings/:id` |
| Payouts | `GET /payouts/me`, `POST /admin/payouts/:id/mark-paid` |
| Incidents | `GET /incidents` |
| Fraud | `GET /admin/flagged-events`, `POST /admin/flagged-events/:id/review` |
| Audit | `GET /admin/audit?entity_type=&entity_id=` |
| Support | `GET /tickets` |

---

## 📄 License

Proprietary — Carezoa Healthcare Pvt. Ltd.
