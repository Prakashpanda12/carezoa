# CAREZOA Patient App

The customer-facing side of the verified home-nursing marketplace.
Expo (managed, SDK 52) · React Native · **TypeScript strict** · expo-router.

Books nursing/elder-care/recovery visits with verified providers, shows live
visit status (scheduled → confirmed → en route → checked-in → in-service →
completed), masked calling, in-app chat, care records, family access scopes,
care plans, and sandbox payments through an in-app WebView.

## Quick start

```bash
# 1) backend (repo root) — the mock/dev implementation of /api/v1
npm install
npm run dev                 # http://localhost:3000  (contract: ../API.md)

# 2) app (this folder)
cd mobile
npm install

# emulator/simulator
npx expo start              # press a / i

# physical device on the same Wi-Fi
EXPO_PUBLIC_API_URL=http://<your-LAN-IP>:3000 npx expo start
```

**Sandbox sign-in:** any phone + OTP `123456`.
**Sandbox payment:** the in-app checkout page has "Pay" and "Simulate failure".

## Environment

| Variable | Purpose | Example |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | API origin the app calls (Android emulator falls back to `http://10.0.2.2:3000`) | `http://192.168.1.20:3000` |
| `GOOGLE_MAPS_ANDROID_KEY` | production Google Maps key (Expo Go ships a default) in `app.config.ts` | `AIza…` |

Point at **staging/production** by exporting `EXPO_PUBLIC_API_URL` (EAS build
profiles in `eas.json` already define per-channel values — edit them to yours).

## Stack decisions

- **Navigation:** expo-router (file-based) with **imperative** guards —
  `app/*` routes are thin wrappers over `src/screens/<domain>/`.
- **Server state:** TanStack Query (`src/api/hooks.ts`), polling for live
  visit status/messages.
- **Local/UI state:** Zustand — `store/auth.ts` (SecureStore-backed session,
  "View as member" mode), `store/bookingDraft.ts` (**persisted to
  AsyncStorage → half-filled bookings survive backgrounding/offline**).
- **Forms:** react-hook-form + zod schemas (`src/utils/schemas.ts`).
- **Styling:** NativeWind (Tailwind for RN) + `src/theme/tokens.ts`.
- **i18n:** i18next with `en` / `or` (ଓଡ଼ିଆ) / `hi` (हिन्दी) from day one —
  switch in Account → Language; device language auto-detected.
- **Auth tokens:** `expo-secure-store`; notifications: `expo-notifications`
  (booking confirmed, provider en route, visit completed).
- **Maps:** react-native-maps (provider coverage circle + distance).
- **Payments:** in-app WebView to the sandbox gateway; the app intercepts the
  `carezoa://payment/<result>` deep-link navigation.

## Anti-bypass rules (baked in)

- Provider payloads **never** include phone/email/handles; the app doesn't ask
  for or render them.
- The only call path is **"Call via CAREZOA"** → `POST /calls/masked` →
  short-lived relay number.
- Chat composer **blocks** phone/email/social patterns *before* the server
  scrubs them too (`containsContactInfo`).
- Check-in OTP is display-only in the family app; shared verbally at the door.
- **Book Again** is a first-class retention flow after every completed visit —
  it prefills the SAME provider, service, patient and address.

## Testing

```bash
npm test                     # Jest + React Native Testing Library
npm run e2e                  # Maestro (needs a dev client + reachable backend)
```

- `src/__tests__/schemas.test.ts` — zod validation + anti-bypass guard
- `src/__tests__/bookingDraft.test.ts` — Book Again prefill rules
- `src/__tests__/ui.test.tsx` — atom behavior
- `maestro/book-visit.yaml` — search → book → pay (incl. failure branch) → confirmation

## EAS builds (`eas.json`)

| Profile | Target | API |
|---|---|---|
| `dev-simulator` | iOS sim dev client | `http://localhost:3000` |
| `preview` | internal APK / TestFlight | staging URL (edit) |
| `production` | stores | production URL (edit) |

```bash
eas build --profile preview --platform android
eas build --profile production --platform ios
```

## Structure

```
app/                      expo-router routes (thin wrappers)
  (auth)/…  (tabs)/…  provider/[id]  visit/[id]  chat/[id]  package/[id] …
src/
  screens/              auth, home, search, provider, booking, visit(s),
                        chat, records, family, packages, support, account…
  components/ui/        Button, Field, Card, Chip, Avatar, Screen, Header…
  components/provider/  ProviderCard, RatingSummary, ServiceTile, ReviewRow
  components/booking/   BookingStepper, DayPicker, SlotPicker
  components/visit/     VisitStatusTimeline, OTPHint, BookingCard, StatusChip
  store/                auth.ts (SecureStore), bookingDraft.ts (persisted)
  api/                  client.ts (typed, contract-exact), hooks.ts (Query)
  types/api.ts          DTOs mirrored from the contract (see ../API.md)
  theme/                tokens.ts, globals.css  (tailwind.config.js mirrors)
  i18n/                 en.json, or.json, hi.json
  utils/                format.ts, schemas.ts (zod + contact guard)
  __tests__/            Jest + RNTL
maestro/                e2e flows
app.config.ts           scheme carezoa:// · plugins · env wiring
eas.json                build profiles
```
