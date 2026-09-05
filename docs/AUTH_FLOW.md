# Complete Signup & Login Flow

Proper authentication flow that collects user details before account creation.

## Flow Overview

```
┌─────────────────────────────────────────────────────────────┐
│              USER AUTHENTICATION FLOW                        │
└─────────────────────────────────────────────────────────────┘

Step 1: User enters phone number
         ↓
Step 2: POST /api/v1/auth/check
         - Check if phone exists in database
         - Returns: { exists: boolean }
         ↓
    ┌────┴────┐
    ↓         ↓
 NEW      EXISTING
    ↓         ↓
Step 3a:      Step 3b:
Show signup   Send OTP
form          directly
    ↓         ↓
Collect:      ↓
- Name*      ↓
- DOB        ↓
- Gender     ↓
- City       ↓
- Address    ↓
    ↓         ↓
Step 4a:      Step 4b:
POST          POST
/auth/signup  /auth/login
    ↓         ↓
    └────┬────┘
         ↓
Step 5: User receives OTP (SMS or devCode)
         ↓
Step 6: User enters OTP
         ↓
    ┌────┴────┐
    ↓         ↓
 SIGNUP     LOGIN
    ↓         ↓
Step 7a:      Step 7b:
POST          POST
/signup/      /login/
verify        verify
    ↓         ↓
Create user   Login user
with details  (existing)
    ↓         ↓
    └────┬────┘
         ↓
Step 8: Receive JWT token + patient data
         ↓
Step 9: Check onboardingDone
         ↓
    ┌────┴────┐
    ↓         ↓
  TRUE      FALSE
    ↓         ↓
 Go to      Show
  Home      onboarding
            (optional)
```

---

## API Endpoints

### 1. Check Phone Number

**Endpoint:** `POST /api/v1/auth/check`

**Purpose:** Determine if user should signup or login

**Request:**
```json
{
  "phone": "+919876543210"
}
```

**Response (New User):**
```json
{
  "exists": false
}
```

**Response (Existing User):**
```json
{
  "exists": true,
  "needsOnboarding": false
}
```

---

### 2. Signup (New Users)

#### 2a. Request Signup OTP

**Endpoint:** `POST /api/v1/auth/signup`

**Purpose:** Request OTP for new user registration with details

**Request:**
```json
{
  "phone": "+919876543210",
  "name": "Rahul Kumar",
  "dob": "15/05/1990",
  "gender": "M",
  "city": "Bhubaneswar",
  "address": "123 Main Street, Patia"
}
```

**Required Fields:**
- `phone` - Valid phone number (10-15 digits)
- `name` - Full name (minimum 2 characters)

**Optional Fields:**
- `dob` - Date of birth (DD/MM/YYYY format)
- `gender` - M (Male), F (Female), or O (Other)
- `city` - City name
- `address` - Full address

**Response (Success - 200):**
```json
{
  "requestId": "otp_1693847562_abc123",
  "expiresInSec": 300,
  "devCode": "847293"  // Dev mode only
}
```

**Response (Error - 409 Conflict):**
```json
{
  "error": "Phone number already registered. Please login instead."
}
```

**Response (Error - 400 Bad Request):**
```json
{
  "error": "Name is required (minimum 2 characters)"
}
```

#### 2b. Verify Signup OTP

**Endpoint:** `POST /api/v1/auth/signup/verify`

**Purpose:** Verify OTP and create new user account

**Request:**
```json
{
  "phone": "+919876543210",
  "code": "847293"
}
```

**Response (Success - 200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "isNewUser": true,
  "patient": {
    "id": 123,
    "name": "Rahul Kumar",
    "phone": "+919876543210",
    "dob": "1990-05-15",
    "gender": "M",
    "city": "Bhubaneswar",
    "address": "123 Main Street, Patia",
    "onboardingDone": true
  }
}
```

**Note:** `onboardingDone` is automatically set to `true` if name, dob, and gender are provided during signup.

---

### 3. Login (Existing Users)

#### 3a. Request Login OTP

**Endpoint:** `POST /api/v1/auth/login`

**Purpose:** Request OTP for existing user login

**Request:**
```json
{
  "phone": "+919876543210"
}
```

**Response (Success - 200):**
```json
{
  "requestId": "otp_1693847562_xyz789",
  "expiresInSec": 300,
  "devCode": "529174"  // Dev mode only
}
```

**Response (Error - 404 Not Found):**
```json
{
  "error": "Phone number not registered. Please signup first."
}
```

#### 3b. Verify Login OTP

**Endpoint:** `POST /api/v1/auth/login/verify`

**Purpose:** Verify OTP and login existing user

**Request:**
```json
{
  "phone": "+919876543210",
  "code": "529174"
}
```

**Response (Success - 200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "isNewUser": false,
  "patient": {
    "id": 123,
    "name": "Rahul Kumar",
    "phone": "+919876543210",
    "dob": "1990-05-15",
    "gender": "M",
    "city": "Bhubaneswar",
    "address": "123 Main Street, Patia",
    "onboardingDone": true
  }
}
```

---

## Complete Flow Examples

### Example 1: New User Signup

```bash
# Step 1: Check if phone exists
curl -X POST http://localhost:3000/api/v1/auth/check \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210"}'

# Response: {"exists": false}

# Step 2: Request signup OTP with user details
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919876543210",
    "name": "Priya Sharma",
    "dob": "20/08/1995",
    "gender": "F",
    "city": "Cuttack",
    "address": "45 Station Road"
  }'

# Response: {"requestId": "otp_123", "expiresInSec": 300, "devCode": "739284"}

# Step 3: Verify OTP and create account
curl -X POST http://localhost:3000/api/v1/auth/signup/verify \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210", "code": "739284"}'

# Response: {"token": "eyJ...", "isNewUser": true, "patient": {...}}
```

### Example 2: Existing User Login

```bash
# Step 1: Check if phone exists
curl -X POST http://localhost:3000/api/v1/auth/check \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210"}'

# Response: {"exists": true, "needsOnboarding": false}

# Step 2: Request login OTP
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210"}'

# Response: {"requestId": "otp_456", "expiresInSec": 300, "devCode": "582947"}

# Step 3: Verify OTP and login
curl -X POST http://localhost:3000/api/v1/auth/login/verify \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210", "code": "582947"}'

# Response: {"token": "eyJ...", "isNewUser": false, "patient": {...}}
```

### Example 3: Quick Test (Dev Mode)

```bash
# Use hardcoded OTP 123456 for any operation

# Signup with dev OTP
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919999999999",
    "name": "Test User"
  }'

curl -X POST http://localhost:3000/api/v1/auth/signup/verify \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919999999999", "code": "123456"}'

# Login with dev OTP
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919999999999"}'

curl -X POST http://localhost:3000/api/v1/auth/login/verify \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919999999999", "code": "123456"}'
```

---

## Mobile App Implementation

### Updated API Client

```typescript
// mobile/src/api/client.ts

// Check if phone exists
export async function checkPhone(phone: string): Promise<{ exists: boolean; needsOnboarding?: boolean }> {
  return call("/auth/check", { method: "POST", body: { phone } });
}

// Request signup OTP with user details
export async function signupRequest(data: {
  phone: string;
  name: string;
  dob?: string;
  gender?: string;
  city?: string;
  address?: string;
}): Promise<{ requestId: string; expiresInSec: number; devCode?: string }> {
  return call("/auth/signup", { method: "POST", body: data });
}

// Verify signup OTP
export async function signupVerify(phone: string, code: string): Promise<AuthResponse> {
  return call("/auth/signup/verify", { method: "POST", body: { phone, code } });
}

// Request login OTP
export async function loginRequest(phone: string): Promise<{ requestId: string; expiresInSec: number; devCode?: string }> {
  return call("/auth/login", { method: "POST", body: { phone } });
}

// Verify login OTP
export async function loginVerify(phone: string, code: string): Promise<AuthResponse> {
  return call("/auth/login/verify", { method: "POST", body: { phone, code } });
}
```

### Updated SignupFlow Component

```typescript
// mobile/src/screens/SignupFlow.tsx

const [step, setStep] = useState<"phone" | "details" | "otp">("phone");
const [phone, setPhone] = useState("");
const [isNewUser, setIsNewUser] = useState<boolean | null>(null);
const [details, setDetails] = useState({
  name: "",
  dob: "",
  gender: "",
  city: "",
  address: "",
});

// Step 1: Enter phone and check if exists
async function handlePhoneSubmit() {
  const result = await api.checkPhone(phone);
  setIsNewUser(!result.exists);
  
  if (result.exists) {
    // Existing user - go directly to OTP
    await api.loginRequest(phone);
    setStep("otp");
  } else {
    // New user - collect details first
    setStep("details");
  }
}

// Step 2: Collect user details (new users only)
async function handleDetailsSubmit() {
  await api.signupRequest({
    phone,
    name: details.name,
    dob: details.dob,
    gender: details.gender,
    city: details.city,
    address: details.address,
  });
  setStep("otp");
}

// Step 3: Verify OTP
async function handleOtpVerify(code: string) {
  const result = isNewUser
    ? await api.signupVerify(phone, code)
    : await api.loginVerify(phone, code);
  
  // Store token and user data
  useAuth.getState().setSession(result.token, result.patient);
  
  // Redirect based on onboarding status
  if (result.patient.onboardingDone) {
    router.replace("/(tabs)/home");
  } else {
    router.replace("/profile-setup");
  }
}
```

---

## Key Differences from Old Flow

| Aspect | Old Flow | New Flow |
|--------|----------|----------|
| **User Details** | Collected AFTER account creation | Collected BEFORE account creation |
| **Account Creation** | Empty profile created on OTP verify | Complete profile created with all details |
| **Signup vs Login** | Single endpoint for both | Separate endpoints for clarity |
| **Phone Check** | Not available | Check endpoint to determine flow |
| **Onboarding** | Always required | Optional if details provided during signup |
| **Data Integrity** | Incomplete profiles possible | Complete profiles guaranteed |

---

## Security & Validation

### Signup Validation
- ✅ Phone number format (10-15 digits)
- ✅ Name required (minimum 2 characters)
- ✅ Gender validation (M/F/O only)
- ✅ Phone must NOT exist (signup only for new users)
- ✅ Date format validation (DD/MM/YYYY)
- ✅ Rate limiting (one OTP per phone)

### Login Validation
- ✅ Phone number format
- ✅ Phone MUST exist (login only for existing users)
- ✅ Rate limiting

### OTP Security
- ✅ 6-digit random OTP
- ✅ 5-minute expiration
- ✅ Maximum 5 attempts
- ✅ One-time use
- ✅ Purpose-specific (signup vs login)

---

## Error Handling

| Scenario | Error Code | Message |
|----------|-----------|---------|
| Phone already registered (signup) | 409 | "Phone number already registered. Please login instead." |
| Phone not registered (login) | 404 | "Phone number not registered. Please signup first." |
| Invalid phone format | 400 | "Valid phone number required" |
| Missing name (signup) | 400 | "Name is required (minimum 2 characters)" |
| Invalid gender | 400 | "Gender must be M (Male), F (Female), or O (Other)" |
| OTP expired | 401 | "OTP expired" |
| Wrong OTP | 401 | "Incorrect OTP" |
| Too many attempts | 401 | "Too many attempts. Please request a new OTP" |
| Rate limited | 429 | "OTP already sent. Please wait" |

---

## Production Checklist

- [ ] Integrate SMS provider for OTP delivery
- [ ] Remove `devCode` from production responses
- [ ] Add phone number validation service
- [ ] Implement IP-based rate limiting
- [ ] Add CAPTCHA for signup
- [ ] Log all authentication events
- [ ] Add fraud detection
- [ ] Implement account lockout after failed attempts
- [ ] Add email verification (optional)
- [ ] Add social login options (Google, Facebook)

---

**Last Updated:** September 6, 2026  
**Version:** 2.0.0
