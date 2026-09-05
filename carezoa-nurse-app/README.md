# Carezoa Provider App

> **Healthcare at your doorstep** — for nurses, doctors, physiotherapists, lab technicians & more.

The **Carezoa Provider App** is the provider-facing side of the Carezoa home-healthcare marketplace. Healthcare professionals use this app to get verified, manage their calendar, accept bookings, navigate to patients, check in, submit service reports, and track earnings.

Built with **Expo + React Native + TypeScript** and integrated with the `carezoa-backend` FastAPI service.

---

## 🏗 Architecture

- **Expo SDK 51** with Expo Router
- **TypeScript** throughout
- **TanStack Query** for server state management
- **Zustand** with persistence for client state (auth, onboarding, offline queue)
- **React Hook Form + Zod** for form validation
- **NativeWind** (Tailwind CSS) for styling
- **expo-secure-store** for token storage
- **expo-notifications** for push notifications
- **react-native-maps** for maps and navigation
- **i18next** for internationalization

### Key Design Decisions

1. **Extensible provider types** — The base URL and types support nurses, doctors, physiotherapists, lab technicians, and attendants. The app is branded as "Carezoa Provider" to accommodate all types.

2. **Offline-safe clinical workflow** — Check-in, OTP verification, and service report submission use a persisted Zustand queue (`offlineQueueStore`) that retries automatically when connectivity returns. This is critical for clinical-adjacent workflows.

3. **Clinical-scope guardrails** — UI-level guards prevent:
   - Selecting services below qualification requirements (greyed out with explanation)
   - Skipping the CheckIn → ServiceReport → Complete flow
   - Silent cancellations (policy disclosure + reliability score impact shown)
   - High-risk services require verified prescriptions before OTP step

4. **Security** — Provider payloads never contain patient contact details. Chat is scrubbed of contact patterns. Calls go through masked telephony only.

---

## 📁 Folder Structure

```
carezoa-nurse-app/
├── App.tsx                          # Entry point
├── app.json                         # Expo config
├── app.config.ts                    # Dynamic Expo config
├── eas.json                         # EAS Build profiles
├── babel.config.js
├── tailwind.config.js
├── tsconfig.json
├── package.json
├── assets/
└── src/
    ├── navigation/
    │   └── AppNavigator.tsx         # React Navigation setup
    ├── screens/
    │   ├── auth/
    │   │   ├── PhoneOTPLoginScreen.tsx
    │   │   └── ProviderOnboardingWizardScreen.tsx
    │   ├── core/
    │   │   ├── DashboardScreen.tsx
    │   │   ├── NewBookingRequestsScreen.tsx
    │   │   ├── CalendarScreen.tsx
    │   │   ├── EarningsScreen.tsx
    │   │   ├── ServiceCatalogueScreen.tsx
    │   │   └── ServiceAreaScreen.tsx
    │   ├── visit/
    │   │   ├── VisitDetailScreen.tsx
    │   │   ├── NavigateToPatientScreen.tsx
    │   │   ├── ServiceReportFormScreen.tsx
    │   │   ├── VisitCompleteScreen.tsx
    │   │   └── ReportIncidentScreen.tsx
    │   ├── booking/
    │   │   ├── MyBookingsScreen.tsx
    │   │   └── CancelRescheduleBookingScreen.tsx
    │   └── account/
    │       ├── ProfileCredentialsScreen.tsx
    │       ├── MyProfileScreen.tsx
    │       ├── QualityScorecardScreen.tsx
    │       ├── MessagesScreen.tsx
    │       ├── RatingsScreen.tsx
    │       ├── ReferAndEarnScreen.tsx
    │       ├── BenefitsScreen.tsx
    │       └── SupportScreen.tsx
    ├── components/
    │   ├── ui/                      # Button, Card, Input, Badge, etc.
    │   ├── booking/                 # BookingRequestCard, AcceptDeclineBar, etc.
    │   ├── calendar/                # SlotGrid
    │   ├── visit/                   # CheckInStepper, ServiceReportField, etc.
    │   ├── quality/                 # ScorecardMetricCard
    │   └── earnings/               # PayoutRow, EarningsSummaryCard
    ├── store/
    │   ├── authStore.ts             # Auth state (Zustand + SecureStore)
    │   ├── onboardingStore.ts       # Resumable wizard state
    │   └── offlineQueueStore.ts     # Retry-safe operation queue
    ├── api/
    │   ├── client.ts                # Axios instance + auth interceptors
    │   ├── auth.ts                  # OTP request/verify
    │   ├── provider.ts              # Profile, credentials, service area
    │   ├── bookings.ts              # Booking lifecycle
    │   ├── services.ts              # Service catalogue & offerings
    │   ├── availability.ts          # Weekly availability
    │   ├── payouts.ts               # Earnings & payouts
    │   ├── communication.ts         # Chat & masked calls
    │   ├── incidents.ts             # Incident reporting
    │   └── analytics.ts             # Quality scorecard & ratings
    ├── hooks/
    │   ├── useAuth.ts
    │   ├── useBookings.ts
    │   └── useProvider.ts
    ├── types/
    │   └── index.ts                 # All TypeScript types
    ├── theme/
    │   └── index.ts                 # Colors, spacing, typography
    ├── i18n/
    │   ├── index.ts
    │   └── locales/en.json
    └── utils/
        ├── format.ts                # Date, currency, status formatting
        ├── navigation.ts            # Deep-link to maps, phone, SMS
        ├── offlineQueue.ts          # Queue processor
        └── notifications.ts         # Push notification setup
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator

### Installation

```bash
cd carezoa-nurse-app
npm install
```

### Environment Variables

Create a `.env` file (or set in `eas.json` build profiles):

```env
EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1
APP_ENV=development
EAS_PROJECT_ID=your-project-id
```

### Run the App

```bash
# Start Expo dev server
npx expo start

# Run on iOS
npx expo start --ios

# Run on Android
npx expo start --android
```

### Connect to Backend

1. Start the backend:
   ```bash
   cd ../carezoa-backend
   docker compose up db redis minio -d
   uvicorn app.main:app --reload
   ```

2. Set `EXPO_PUBLIC_API_URL` to:
   - **iOS Simulator**: `http://localhost:8000/api/v1`
   - **Android Emulator**: `http://10.0.2.2:8000/api/v1`
   - **Physical device**: `http://<your-machine-ip>:8000/api/v1`

3. **Sandbox login**: Any phone number + OTP `123456` (when `APP_ENV != prod`)

---

## 📱 Screens

### Auth & Onboarding
| Screen | Description |
|---|---|
| `PhoneOTPLogin` | Phone number + OTP verification |
| `ProviderOnboardingWizard` | 4-step resumable wizard (basic info → services & area → document upload → agreement → pending approval) |

### Core
| Screen | Description |
|---|---|
| `Dashboard` | Today's schedule, earnings snapshot, verification status banner |
| `NewBookingRequests` | Accept/decline within SLA |
| `Calendar` | Availability management with recurring weekly slots |
| `Earnings` | Per-booking payout history, pending vs paid |
| `ServiceCatalogue` | Select services + set prices (ineligible services greyed out) |
| `ServiceArea` | Pincode/radius picker on map |

### Visit Execution
| Screen | Description |
|---|---|
| `VisitDetail` | Full visit details with check-in flow |
| `NavigateToPatient` | Map view + deep-link to maps app |
| `CheckInFlow` | En route → arrived → OTP → in service |
| `ServiceReportForm` | Structured report with conditional vitals fields |
| `VisitComplete` | Post-visit confirmation |
| `ReportIncident` | Safety/incident report (always accessible) |

### Booking Management
| Screen | Description |
|---|---|
| `MyBookings` | Accepted bookings (upcoming/past/all tabs) |
| `CancelRescheduleBooking` | Policy disclosure + reliability impact before confirming |

### Account
| Screen | Description |
|---|---|
| `ProfileCredentials` | Verification status per document with badges |
| `MyProfile` | Editable profile + read-only scope & limitations |
| `QualityScorecard` | 8 quality metrics from backend analytics |
| `Messages` | In-app chat + masked-call button |
| `Ratings` | Own rating history |
| `ReferAndEarn` | Referral code/link + referred nurses status |
| `Benefits` | Insurance/benefits info (placeholder-safe) |
| `Support` | Create and view support tickets |

---

## 🔒 Security & Guardrails

1. **Clinical-scope enforcement** — ServiceCatalogue only lets providers select services they're qualified for (backend enforces, UI shows explanation for ineligible)
2. **Sequential visit flow** — Cannot skip CheckIn → ServiceReport → Complete
3. **High-risk service guard** — Prescription must be verified before OTP step for high-risk services
4. **Cancellation transparency** — CancelRescheduleBooking always shows policy + reliability impact
5. **Incident escape hatch** — ReportIncident available from VisitDetail regardless of visit status
6. **Anti-bypass** — Chat scrubbed of contact patterns, calls only via masked telephony
7. **Offline-safe** — Check-in/OTP/report operations queued and retried automatically

---

## 📦 EAS Build Profiles

| Profile | Description |
|---|---|
| `development` | Dev client with local backend |
| `preview` | Internal distribution with preview backend |
| `production` | Production build with production backend |

```bash
# Build for development
eas build --profile development

# Build for preview
eas build --profile preview

# Build for production
eas build --profile production
```

---

## 🔔 Push Notifications

The app registers for push notifications on first launch and sends the Expo push token to the backend. Notifications are sent for:

- **New booking requests** — When a patient books your services
- **Re-verification reminders** — When credentials are expiring
- **Payout confirmations** — When a payout is processed
- **Booking status changes** — When a booking is updated

---

## 🌐 API Integration

The app consumes the `carezoa-backend` REST API at `/api/v1`. Key endpoints:

| Domain | Endpoints |
|---|---|
| Auth | `POST /auth/otp/request`, `POST /auth/otp/verify`, `POST /auth/refresh` |
| Provider | `GET/PATCH /providers/me`, `POST /providers/me/credentials` |
| Availability | `GET/PUT /providers/me/availability` |
| Services | `GET /services`, `GET/POST /providers/me/offerings` |
| Bookings | `GET /providers/me/bookings`, `POST /bookings/:id/provider-departed`, `POST /bookings/:id/verify-otp`, `POST /bookings/:id/start`, `POST /bookings/:id/complete`, `POST /bookings/:id/report` |
| Payouts | `GET /payouts/me` |
| Communication | `GET/POST /bookings/:id/messages`, `POST /bookings/:id/masked-call` |
| Incidents | `POST /bookings/:id/incident` |
| Analytics | `GET /providers/me/scorecard`, `GET /providers/me/ratings` |
| Support | `GET/POST /tickets` |

---

## 📄 License

Proprietary — Carezoa Healthcare Pvt. Ltd.
