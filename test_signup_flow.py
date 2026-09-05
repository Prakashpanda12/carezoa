#!/usr/bin/env python3
"""
Test script to verify the complete signup flow:
1. Check if phone exists (should be false for new user)
2. Request OTP
3. Verify OTP (creates user with empty profile)
4. Update profile with user details
5. Get profile (should show all details)
"""

import requests
import json
import sys

BASE_URL = "http://localhost:8000/api/v1"

def test_signup_flow():
    phone = "+919999999999"
    otp_code = "123456"  # Dev mode OTP
    
    print("=" * 60)
    print("TESTING SIGNUP FLOW")
    print("=" * 60)
    
    # Step 1: Check if phone exists
    print("\n[Step 1] Checking if phone exists...")
    response = requests.post(f"{BASE_URL}/auth/check", json={"phone": phone})
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code != 200:
        print("❌ Failed to check phone")
        return False
    
    check_data = response.json()
    if check_data.get("exists"):
        print("⚠️  Phone already exists. Using a different phone number.")
        phone = "+919999999998"
        response = requests.post(f"{BASE_URL}/auth/check", json={"phone": phone})
        print(f"Retried with {phone}: {json.dumps(response.json(), indent=2)}")
    
    # Step 2: Request OTP
    print("\n[Step 2] Requesting OTP...")
    response = requests.post(f"{BASE_URL}/auth/otp/request", json={"phone": phone})
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code != 200:
        print("❌ Failed to request OTP")
        return False
    
    otp_data = response.json()
    dev_code = otp_data.get("dev_code")
    if dev_code:
        print(f"✓ Dev OTP code: {dev_code}")
        otp_code = dev_code
    
    # Step 3: Verify OTP
    print("\n[Step 3] Verifying OTP...")
    response = requests.post(f"{BASE_URL}/auth/otp/verify", json={
        "phone": phone,
        "code": otp_code
    })
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code != 200:
        print("❌ Failed to verify OTP")
        return False
    
    auth_data = response.json()
    access_token = auth_data.get("access_token")
    
    if not access_token:
        print("❌ No access token received")
        return False
    
    print(f"✓ Access token received (length: {len(access_token)})")
    
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Step 4: Get profile (should be empty for new user)
    print("\n[Step 4] Getting profile (should be empty for new user)...")
    response = requests.get(f"{BASE_URL}/patients/me", headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code != 200:
        print("❌ Failed to get profile")
        return False
    
    profile_before = response.json()
    print(f"✓ Profile before update:")
    print(f"  - Name: '{profile_before.get('name', '')}'")
    print(f"  - DOB: '{profile_before.get('dob', '')}'")
    print(f"  - Gender: '{profile_before.get('gender', '')}'")
    print(f"  - City: '{profile_before.get('city', '')}'")
    print(f"  - Onboarding done: {profile_before.get('onboarding_done')}")
    
    # Step 5: Update profile with user details
    print("\n[Step 5] Updating profile with user details...")
    user_details = {
        "name": "Rahul Kumar",
        "dob": "15/05/1990",
        "gender": "M",
        "city": "Bhubaneswar",
        "address": "123 Main Street, Patia"
    }
    print(f"Sending: {json.dumps(user_details, indent=2)}")
    
    response = requests.patch(f"{BASE_URL}/patients/me", headers=headers, json=user_details)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code != 200:
        print("❌ Failed to update profile")
        print(f"Error: {response.text}")
        return False
    
    profile_after_update = response.json()
    print(f"✓ Profile after update:")
    print(f"  - Name: '{profile_after_update.get('name', '')}'")
    print(f"  - DOB: '{profile_after_update.get('dob', '')}'")
    print(f"  - Gender: '{profile_after_update.get('gender', '')}'")
    print(f"  - City: '{profile_after_update.get('city', '')}'")
    print(f"  - Onboarding done: {profile_after_update.get('onboarding_done')}")
    
    # Step 6: Get profile again to verify
    print("\n[Step 6] Getting profile again to verify persistence...")
    response = requests.get(f"{BASE_URL}/patients/me", headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code != 200:
        print("❌ Failed to get profile")
        return False
    
    profile_final = response.json()
    print(f"✓ Final profile:")
    print(f"  - Name: '{profile_final.get('name', '')}'")
    print(f"  - DOB: '{profile_final.get('dob', '')}'")
    print(f"  - Gender: '{profile_final.get('gender', '')}'")
    print(f"  - City: '{profile_final.get('city', '')}'")
    print(f"  - Onboarding done: {profile_final.get('onboarding_done')}")
    
    # Verify all details are saved
    print("\n" + "=" * 60)
    print("VERIFICATION")
    print("=" * 60)
    
    checks = [
        ("Name", profile_final.get("name") == "Rahul Kumar"),
        ("DOB", profile_final.get("dob") == "15/05/1990"),
        ("Gender", profile_final.get("gender") == "M"),
        ("City", profile_final.get("city") == "Bhubaneswar"),
        ("Address", profile_final.get("address") == "123 Main Street, Patia"),
        ("Onboarding done", profile_final.get("onboarding_done") == True),
    ]
    
    all_passed = True
    for field, passed in checks:
        status = "✓ PASS" if passed else "❌ FAIL"
        print(f"{status}: {field}")
        if not passed:
            all_passed = False
    
    print("=" * 60)
    if all_passed:
        print("✓ ALL TESTS PASSED - Signup flow works correctly!")
        return True
    else:
        print("❌ SOME TESTS FAILED - Check the output above")
        return False

if __name__ == "__main__":
    try:
        success = test_signup_flow()
        sys.exit(0 if success else 1)
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Cannot connect to backend at http://localhost:8000")
        print("Make sure the backend is running:")
        print("  cd /home/user/carezoa/carezoa-backend")
        print("  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
