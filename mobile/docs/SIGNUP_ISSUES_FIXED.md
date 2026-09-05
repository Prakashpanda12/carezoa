# Signup Screen Issues - Fixed

**Date:** 2026-09-06  
**Component:** `mobile/src/screens/SignupFlow.tsx`  
**Tester:** Senior QA Engineer

---

## Issues Found & Fixed

### Issue #1: Unused Variable (Code Quality)
**Severity:** Low  
**Location:** Line 77, `verifyOtp` function

**Problem:**
```typescript
let patient = null;  // Declared but never used
try {
  await setSession(res.access_token, null);
  patient = await api.getProfile();  // Assigned but never read
  setPatient(patient);
} catch {
  // ...
}
```

**Fix:**
Removed the unused `patient` variable declaration. The profile is fetched and passed directly to `setPatient()` without intermediate storage.

**Status:** ✅ Fixed

---

### Issue #2: Misleading "Resend" Button
**Severity:** Medium  
**Location:** OTP step, line ~280

**Problem:**
Button text says "Resend" but actually navigates back to the phone step instead of resending the OTP.

**Fix:**
Changed button text from `t("auth.resend")` to `"Use a different phone number"` to accurately describe the action.

**Status:** ✅ Fixed

---

### Issue #3: No Loading Indicator During Profile Fetch
**Severity:** High  
**Location:** `verifyOtp` function

**Problem:**
After OTP verification, the app fetches the user profile silently with no visual feedback. Users may think the app is frozen.

**Fix:**
Added a loading overlay with contextual messages:
- "Verifying your code..."
- "Setting up your account..."
- "Loading your profile..."

The overlay appears during the entire verification process and disappears when complete.

**Status:** ✅ Fixed

---

### Issue #4: No Progress Indicator
**Severity:** Medium  
**Location:** All steps except welcome and success

**Problem:**
Users don't know which step they're on or how many steps remain.

**Fix:**
Added a progress indicator in the header showing "Step X of Y":
```typescript
<View className="ml-auto">
  <Text className="text-[12px] text-soft">
    Step {STEPS.indexOf(step)} of {STEPS.length - 2}
  </Text>
</View>
```

**Status:** ✅ Fixed

---

### Issue #5: Nested ScrollView Gesture Conflicts
**Severity:** Medium  
**Location:** Terms step, line ~450

**Problem:**
Terms content is wrapped in a ScrollView inside the main ScrollView, causing gesture conflicts on Android.

**Fix:**
Added `nestedScrollEnabled` and `showsVerticalScrollIndicator` props to the inner ScrollView:
```typescript
<ScrollView 
  style={{ maxHeight: 300 }}
  nestedScrollEnabled
  showsVerticalScrollIndicator
>
```

**Status:** ✅ Fixed

---

### Issue #6: No Auto-focus on OTP Input
**Severity:** Low  
**Location:** OTP step

**Problem:**
When the OTP step appears, the input field doesn't auto-focus, requiring users to tap it manually.

**Fix:**
Added `autoFocus` prop to the OTP Field component:
```typescript
<Field
  // ... other props
  autoFocus
/>
```

**Status:** ✅ Fixed

---

### Issue #7: Race Condition in Session Setup
**Severity:** High  
**Location:** `verifyOtp` function

**Problem:**
`getProfile()` is called immediately after `setSession()` without ensuring the session is fully established, potentially causing authentication failures.

**Fix:**
Added a small delay (100ms) between `setSession` and `getProfile`:
```typescript
await setSession(res.access_token, null);
await new Promise(resolve => setTimeout(resolve, 100));
const profile = await api.getProfile();
```

Also added proper error logging for profile fetch failures.

**Status:** ✅ Fixed

---

### Issue #8: Phone Form Not Cleared on Back Navigation
**Severity:** Medium  
**Location:** `goBack` function

**Problem:**
When users go back from OTP step to phone step, the phone form retains the previous value, which can be confusing.

**Fix:**
Added logic to reset the phone form when navigating back from OTP to phone:
```typescript
if (step === "otp" && prevStep === "phone") {
  phoneForm.reset({ phone: "+91" });
  setPhone("");
}
```

**Status:** ✅ Fixed

---

## Additional Improvements

### Loading Overlay Component
Created a reusable loading overlay that displays contextual messages during async operations:
```typescript
{loadingMessage && (
  <View className="absolute inset-0 z-50 items-center justify-center bg-paper/90">
    <View className="items-center rounded-2xl bg-card p-6 shadow-lg">
      <View className="mb-3 h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      <Text className="text-[14px] font-medium text-ink">{loadingMessage}</Text>
    </View>
  </View>
)}
```

### Field Component Ref Support
Updated the `Field` component to support refs using `React.forwardRef`:
```typescript
export const Field = React.forwardRef<TextInput, FieldProps>(
  ({ label, error, icon, ...input }, ref) => {
    return (
      <View className="mb-4">
        {/* ... */}
        <TextInput ref={ref} {...input} />
        {/* ... */}
      </View>
    );
  }
);
Field.displayName = "Field";
```

### Constants Extraction
Extracted the steps array into a constant for better maintainability:
```typescript
const STEPS: SignupStep[] = ["welcome", "phone", "otp", "profile", "terms", "success"];
```

---

## Test Coverage

Created comprehensive test suite in `src/__tests__/signupFlow.test.tsx` covering:
- ✅ Progress indicator visibility and updates
- ✅ Correct button text ("Use a different phone number")
- ✅ Loading messages during verification
- ✅ Nested ScrollView configuration
- ✅ Auto-focus on OTP input
- ✅ Phone form clearing on back navigation
- ✅ DOB auto-formatting
- ✅ Unused variable removal verification

---

## Files Modified

1. **`mobile/src/screens/SignupFlow.tsx`**
   - Added progress indicator
   - Added loading overlay with contextual messages
   - Fixed "Resend" button text
   - Added auto-focus to OTP input
   - Fixed phone form clearing on back navigation
   - Removed unused variable
   - Added delay between session setup and profile fetch
   - Added nested scroll support for terms

2. **`mobile/src/components/ui.tsx`**
   - Updated `Field` component to support refs via `React.forwardRef`

3. **`mobile/src/__tests__/signupFlow.test.tsx`** (new)
   - Comprehensive test suite for all fixes

---

## Verification Checklist

- [x] Progress indicator shows correct step number
- [x] Loading overlay appears during OTP verification
- [x] Loading messages change as process advances
- [x] "Use a different phone number" button works correctly
- [x] OTP input auto-focuses when step appears
- [x] Phone form clears when going back from OTP
- [x] Terms ScrollView has nested scroll enabled
- [x] DOB auto-formats as DD/MM/YYYY
- [x] No unused variables in code
- [x] Session setup has proper delay before profile fetch
- [x] All tests pass

---

## Recommendations for Future Enhancements

1. **Resend OTP Button**: Add a separate "Resend OTP" button with a countdown timer
2. **Step Validation**: Add visual indicators for completed steps (checkmarks)
3. **Keyboard Handling**: Improve keyboard dismissal on step transitions
4. **Error Recovery**: Add retry buttons for failed API calls
5. **Accessibility**: Add more detailed accessibility labels for screen readers
6. **Analytics**: Track step completion rates and drop-off points

---

## Status

**All Issues Fixed:** ✅  
**Tests Passing:** ✅  
**Production Ready:** ✅

**Reviewed By:** Senior QA Engineer  
**Date:** 2026-09-06
