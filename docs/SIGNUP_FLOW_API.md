# Signup Flow API Documentation

Complete documentation for the mobile number verification and user signup flow.

## Overview

The signup flow consists of:
1. **Request OTP** - Send verification code to phone number
2. **Verify OTP** - Verify the code and authenticate user
3. **Get Profile** - Fetch user profile after authentication
4. **Update Profile** - Complete user onboarding with personal details

## API Endpoints

### 1. Request OTP

**Endpoint:** `POST /api/v1/auth/otp/request`

**Purpose:** Send OTP to phone number for verification

**Request:**
```json
{
  "phone": "+919876543210"
}
```

**Response (Success - 200):**
```json
{
  "requestId": "otp_1234567890_abc123",
  "expiresInSec": 300
}
```

**Response (Dev Mode Only):**
```json
{
  "requestId": "otp_1234567890_abc123",
  "expiresInSec": 300,
  "devCode": "123456"
}
```

**Response (Error - 400):**
```json
{
  "error": "Valid phone number required (10-15 digits with optional + prefix)"
}
```

**Response (Rate Limit - 429):**
```json
{
  "error": "OTP already sent. Please wait before requesting a new one"
}
```

**Implementation Details:**
- Phone number is normalized (spaces and dashes removed)
- OTP is 6 digits, expires in 5 minutes (300 seconds)
- Maximum 5 verification attempts per OTP
- Rate limiting prevents multiple OTPs for same number
- In production, OTP is sent via SMS (not returned in response)
- In development, `devCode` is returned for testing

---

### 2. Verify OTP

**Endpoint:** `POST /api/v1/auth/otp/verify`

**Purpose:** Verify OTP and create/retrieve user account

**Request:**
```json
{
  "phone": "+919876543210",
  "code": "123456"
}
```

**Response (Success - 200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "isNewUser": true,
  "patient": {
    "id": 123,
    "name": "",
    "phone": "+919876543210",
    "dob": null,
    "gender": null,
    "city": null,
    "address": null,
    "onboardingDone": false
  }
}
```

**Response (Error - 401):**
```json
{
  "error": "Invalid OTP"
}
```

**Response (Error - 401 - Expired):**
```json
{
  "error": "OTP expired"
}
```

**Response (Error - 401 - Too Many Attempts):**
```json
{
  "error": "Too many attempts. Please request a new OTP"
}
```

**Implementation Details:**
- Creates new patient if phone number doesn't exist
- Returns JWT token valid for 7 days
- `isNewUser` is true if:
  - Patient was just created, OR
  - Patient exists but `onboardingDone` is false
- Token must be included in `Authorization: Bearer <token>` header for subsequent requests
- Dev mode accepts hardcoded OTP `123456` for testing

---

### 3. Get Profile

**Endpoint:** `GET /api/v1/profile`

**Purpose:** Fetch authenticated user's profile

**Headers:**
```
Authorization: Bearer <token>
```

**Response (Success - 200):**
```json
{
  "id": 123,
  "name": "Rahul Kumar",
  "phone": "+919876543210",
  "dob": "1990-05-15",
  "gender": "M",
  "city": "Bhubaneswar",
  "address": "123 Main Street, Patia",
  "onboardingDone": true
}
```

**Response (Error - 404):**
```json
{
  "error": "Patient not found"
}
```

---

### 4. Update Profile

**Endpoint:** `PATCH /api/v1/profile`

**Purpose:** Update user profile and complete onboarding

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "name": "Rahul Kumar",
  "dob": "15/05/1990",
  "gender": "M",
  "city": "Bhubaneswar",
  "address": "123 Main Street, Patia"
}
```

**Response (Success - 200):**
```json
{
  "id": 123,
  "name": "Rahul Kumar",
  "phone": "+919876543210",
  "dob": "1990-05-15",
  "gender": "M",
  "city": "Bhubaneswar",
  "address": "123 Main Street, Patia",
  "onboardingDone": true
}
```

**Implementation Details:**
- Only updates provided fields (partial update)
- Automatically sets `onboardingDone: true` when all required fields are present:
  - `name` (non-empty)
  - `dob` (valid date)
  - `gender` (M/F/O)
- Editable fields: `name`, `dob`, `gender`, `city`, `address`
- Phone number cannot be changed via this endpoint

---

## Complete Flow Example

### Step 1: Request OTP

```bash
curl -X POST http://localhost:3000/api/v1/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210"}'
```

**Response:**
```json
{
  "requestId": "otp_1693847562_abc123",
  "expiresInSec": 300,
  "devCode": "847293"
}
```

### Step 2: Verify OTP

```bash
curl -X POST http://localhost:3000/api/v1/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210", "code": "847293"}'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXRpZW50SWQiOjEyMywicGhvbmUiOiIrOTE5ODc2NTQzMjEwIiwiaWF0IjoxNjkzODQ3NTYyLCJleHAiOjE2OTQ0NTIzNjJ9.signature",
  "isNewUser": true,
  "patient": {
    "id": 123,
    "name": "",
    "phone": "+919876543210",
    "dob": null,
    "gender": null,
    "city": null,
    "address": null,
    "onboardingDone": false
  }
}
```

### Step 3: Update Profile

```bash
curl -X PATCH http://localhost:3000/api/v1/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "name": "Rahul Kumar",
    "dob": "15/05/1990",
    "gender": "M",
    "city": "Bhubaneswar",
    "address": "123 Main Street, Patia"
  }'
```

**Response:**
```json
{
  "id": 123,
  "name": "Rahul Kumar",
  "phone": "+919876543210",
  "dob": "1990-05-15",
  "gender": "M",
  "city": "Bhubaneswar",
  "address": "123 Main Street, Patia",
  "onboardingDone": true
}
```

### Step 4: Get Profile (Verify)

```bash
curl -X GET http://localhost:3000/api/v1/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**
```json
{
  "id": 123,
  "name": "Rahul Kumar",
  "phone": "+919876543210",
  "dob": "1990-05-15",
  "gender": "M",
  "city": "Bhubaneswar",
  "address": "123 Main Street, Patia",
  "onboardingDone": true
}
```

---

## Security Features

### OTP Security
- ✅ 6-digit random OTP
- ✅ 5-minute expiration
- ✅ Maximum 5 verification attempts
- ✅ Rate limiting (one OTP per phone at a time)
- ✅ Automatic cleanup of expired OTPs
- ✅ One-time use (deleted after successful verification)

### JWT Security
- ✅ HMAC-SHA256 signature
- ✅ 7-day expiration
- ✅ Includes patient ID and phone number
- ✅ Signature verification on every request
- ✅ Expiration check on every request

### Production Recommendations
- 🔒 Use Redis for distributed OTP storage
- 🔒 Integrate with SMS provider (Twilio, MSG91)
- 🔒 Add IP-based rate limiting
- 🔒 Add device fingerprinting
- 🔒 Log all authentication events
- 🔒 Use HTTPS only
- 🔒 Rotate JWT secret periodically

---

## Database Schema

### Patients Table (`cz_patients`)

```sql
CREATE TABLE cz_patients (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL UNIQUE,
  dob DATE,
  gender TEXT CHECK (gender IN ('M', 'F', 'O')),
  city TEXT,
  address TEXT,
  onboarding_done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_patients_phone ON cz_patients(phone);
```

---

## Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Continue |
| 400 | Bad Request | Fix request format |
| 401 | Unauthorized | Check OTP or token |
| 404 | Not Found | Check patient ID |
| 429 | Rate Limited | Wait before retrying |
| 500 | Server Error | Retry or contact support |

---

## Testing

### Development Mode
- Use `devCode` from OTP request response
- Or use hardcoded OTP: `123456`
- No SMS integration required

### Production Mode
- OTP sent via SMS
- `devCode` not returned in response
- Real SMS provider integration required

### Test Scenarios
1. ✅ New user signup
2. ✅ Existing user login
3. ✅ Invalid OTP
4. ✅ Expired OTP
5. ✅ Too many attempts
6. ✅ Rate limiting
7. ✅ Invalid token
8. ✅ Expired token
9. ✅ Profile update
10. ✅ Onboarding completion

---

## Implementation Files

### Backend
- `src/app/api/v1/auth/otp/request/route.ts` - OTP request endpoint
- `src/app/api/v1/auth/otp/verify/route.ts` - OTP verification endpoint
- `src/app/api/v1/profile/route.ts` - Profile endpoints
- `src/server/carezoa/otpService.ts` - OTP generation and verification
- `src/server/carezoa/jwtService.ts` - JWT token generation and verification
- `src/server/carezoa/http.ts` - HTTP helpers and auth middleware

### Frontend (Mobile)
- `mobile/src/screens/SignupFlow.tsx` - Signup flow UI
- `mobile/src/api/client.ts` - API client
- `mobile/src/store/auth.ts` - Auth state management

---

## Support

For issues or questions:
- Check backend logs: `npm run dev`
- Check mobile logs: React Native debugger
- Review API responses in network tab
- Check database: `psql` or pgAdmin

---

**Last Updated:** September 6, 2026  
**Version:** 1.0.0
