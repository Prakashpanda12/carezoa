# Fix: User Details Not Saving in Signup

## 🔍 The Problem

You reported: "user details not coming in api, although i set all data in signup"

**Root Cause:** The mobile app was calling the wrong endpoint path:
- ❌ Mobile app called: `/api/v1/profile`
- ✅ Backend has: `/api/v1/patients/me`

This caused a **404 Not Found** error, so the profile update was failing silently.

---

## ✅ What I Fixed

### 1. Fixed API Endpoint Path
**File:** `mobile/src/api/client.ts`

```typescript
// Changed from:
getProfile: () => request<PatientProfile>("/profile"),
patchProfile: (patch) => request<PatientProfile>("/profile", {...}),

// To:
getProfile: () => request<PatientProfile>("/patients/me"),
patchProfile: (patch) => request<PatientProfile>("/patients/me", {...}),
```

### 2. Added Error Handling & Logging
**File:** `mobile/src/screens/SignupFlow.tsx`

Added console logs to track:
- ✅ Details collected from form
- ✅ Profile update request
- ✅ Profile update response
- ✅ Errors during update

Now if profile update fails, you'll see:
- Error message in the UI
- Detailed logs in the console
- User is sent back to details form to retry

---

## 🧪 How to Test

### Option 1: Using the Test Script (Recommended)

I created a Python test script that tests the complete flow:

```bash
cd /home/user/carezoa
python3 test_signup_flow.py
```

This will:
1. Check if phone exists
2. Request OTP
3. Verify OTP
4. Update profile with details
5. Verify details are saved

**Expected Output:**
```
✓ PASS: Name
✓ PASS: DOB
✓ PASS: Gender
✓ PASS: City
✓ PASS: Address
✓ PASS: Onboarding done
✓ ALL TESTS PASSED
```

### Option 2: Manual Testing with curl

```bash
# 1. Request OTP
curl -X POST http://localhost:8000/api/v1/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919999999999"}'

# Response: {"request_id": 1, "expires_in_sec": 600, "dev_code": "123456"}

# 2. Verify OTP
curl -X POST http://localhost:8000/api/v1/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919999999999", "code": "123456"}'

# Response: {"access_token": "eyJ...", "refresh_token": "eyJ...", ...}
# Save the access_token!

# 3. Get profile (should be empty)
TOKEN="eyJ..."  # Use the token from step 2
curl -X GET http://localhost:8000/api/v1/patients/me \
  -H "Authorization: Bearer $TOKEN"

# Response: {"id": 1, "name": "", "dob": "", "gender": "", ...}

# 4. Update profile
curl -X PATCH http://localhost:8000/api/v1/patients/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rahul Kumar",
    "dob": "15/05/1990",
    "gender": "M",
    "city": "Bhubaneswar",
    "address": "123 Main Street"
  }'

# Response: {"id": 1, "name": "Rahul Kumar", "dob": "15/05/1990", ...}

# 5. Get profile again (should have all details)
curl -X GET http://localhost:8000/api/v1/patients/me \
  -H "Authorization: Bearer $TOKEN"

# Response: {"id": 1, "name": "Rahul Kumar", "dob": "15/05/1990", ...}
```

### Option 3: Test in Mobile App

1. **Start the backend** (see below)
2. **Start the mobile app:**
   ```bash
   cd /home/user/carezoa/mobile
   npm start
   ```
3. **Scan QR code** with Expo Go
4. **Test signup:**
   - Enter phone: `+919999999999`
   - Fill details: Name, DOB, Gender, City, Address
   - Enter OTP: `123456`
   - Check console logs for: `[SIGNUP] Profile updated successfully`

---

## 🚀 How to Start the Backend

If the backend is not running, you need to start it:

### Option A: Using Docker (Easiest)

```bash
cd /home/user/carezoa/carezoa-backend

# Start PostgreSQL and Redis
docker compose up db redis -d

# Apply database migrations
alembic upgrade head

# Seed test data
python -m scripts.seed

# Start API server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Option B: Without Docker

```bash
# Install and start PostgreSQL
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Install and start Redis
sudo apt install redis-server
sudo systemctl start redis-server

# Create database
sudo -u postgres psql <<EOF
CREATE DATABASE carezoa;
CREATE USER carezoa WITH PASSWORD 'carezoa';
GRANT ALL PRIVILEGES ON DATABASE carezoa TO carezoa;
EOF

# Setup backend
cd /home/user/carezoa/carezoa-backend
alembic upgrade head
python -m scripts.seed

# Start API
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## 🐛 Debugging

### Check Backend Logs

When you run the signup flow, check the backend terminal for:
- ✅ `POST /api/v1/auth/check` - 200 OK
- ✅ `POST /api/v1/auth/otp/request` - 200 OK
- ✅ `POST /api/v1/auth/otp/verify` - 200 OK
- ✅ `GET /api/v1/patients/me` - 200 OK
- ✅ `PATCH /api/v1/patients/me` - 200 OK

### Check Mobile App Logs

In the Expo terminal or React Native debugger, look for:
```
[SIGNUP] Details collected: {name: "Rahul Kumar", dob: "15/05/1990", ...}
[SIGNUP] Updating profile with: {name: "Rahul Kumar", dob: "15/05/1990", ...}
[SIGNUP] Profile updated successfully: {id: 1, name: "Rahul Kumar", ...}
```

If you see an error:
```
[SIGNUP] Failed to update profile: Error: ...
```

Then the PATCH request is failing. Check:
1. Backend is running on port 8000
2. Access token is valid
3. Database connection is working

### Common Issues

| Issue | Solution |
|-------|----------|
| `404 Not Found` on `/patients/me` | Backend not running or wrong port |
| `401 Unauthorized` | Access token expired or invalid |
| `500 Internal Server Error` | Database connection issue |
| Details not saving | Check PATCH request in network tab |
| `onboarding_done: false` | Missing required fields (name, dob, gender) |

---

## 📋 Complete Flow Diagram

```
┌─────────────────────────────────┐
│  1. User enters phone           │
└────────────┬────────────────────┘
             ↓
┌─────────────────────────────────┐
│  2. POST /auth/check            │ ← Check if phone exists
│  Response: {exists: false}      │
└────────────┬────────────────────┘
             ↓
┌─────────────────────────────────┐
│  3. Show details form           │
│  User fills:                    │
│  - Name: "Rahul Kumar"          │
│  - DOB: "15/05/1990"            │
│  - Gender: "M"                  │
│  - City: "Bhubaneswar"          │
│  - Address: "123 Main St"       │
└────────────┬────────────────────┘
             ↓
┌─────────────────────────────────┐
│  4. POST /auth/otp/request      │ ← Request OTP
│  Response: {dev_code: "123456"} │
└────────────┬────────────────────┘
             ↓
┌─────────────────────────────────┐
│  5. User enters OTP: 123456     │
└────────────┬────────────────────┘
             ↓
┌─────────────────────────────────┐
│  6. POST /auth/otp/verify       │ ← Verify OTP
│  Response: {access_token: "..."}│
│  (Creates user with EMPTY profile)│
└────────────┬────────────────────┘
             ↓
┌─────────────────────────────────┐
│  7. PATCH /patients/me          │ ← Update profile
│  Body: {name, dob, gender, ...} │
│  Response: {updated profile}    │
│  (Sets onboarding_done: true)   │
└────────────┬────────────────────┘
             ↓
┌─────────────────────────────────┐
│  8. GET /patients/me            │ ← Verify details saved
│  Response: {all details}        │
└────────────┬────────────────────┘
             ↓
┌─────────────────────────────────┐
│  9. Success! Go to home         │
└─────────────────────────────────┘
```

---

## ✅ Verification Checklist

After testing, verify:

- [ ] Backend is running on port 8000
- [ ] Can call `GET /api/v1/patients/me` (not `/profile`)
- [ ] Can call `PATCH /api/v1/patients/me` (not `/profile`)
- [ ] Profile update returns 200 OK
- [ ] Updated profile has all details (name, dob, gender, city, address)
- [ ] `onboarding_done` is `true` after update
- [ ] Mobile app shows success screen
- [ ] No errors in console logs

---

## 📞 Need Help?

If you're still having issues:

1. **Run the test script:**
   ```bash
   python3 test_signup_flow.py
   ```
   This will show exactly where the flow breaks.

2. **Check the logs:**
   - Backend terminal (uvicorn logs)
   - Mobile app console (Expo/React Native logs)

3. **Test with curl:**
   Use the curl commands above to test each endpoint individually.

4. **Check the network tab:**
   In React Native debugger, check the Network tab to see the actual HTTP requests and responses.

---

## 📝 Summary

**What was wrong:**
- Mobile app called `/profile` but backend has `/patients/me`
- Profile update was failing with 404 error
- Details were not being saved

**What I fixed:**
- ✅ Changed endpoint path to `/patients/me`
- ✅ Added error handling and logging
- ✅ Created test script to verify flow

**Next steps:**
1. Start the backend (if not running)
2. Run `python3 test_signup_flow.py` to verify
3. Test in mobile app
4. Check logs if issues persist

**Commit:** `b35c655` - Added logging and error handling

---

**Last Updated:** September 6, 2026
