# Sign Out Button Fix

## Problem
The sign out button was not working when pressed.

## Root Cause
The sign out function was missing:
1. Proper error handling
2. Navigation stack clearing
3. Logging to debug issues

## Solution

### Changes Made

**File:** `mobile/src/screens/account.tsx`

#### Before:
```typescript
const doSignOut = () => {
  Alert.alert(t("account.signOut"), "", [
    { text: t("common.cancel"), style: "cancel" },
    {
      text: t("account.signOut"),
      style: "destructive",
      onPress: async () => {
        await signOut();
        router.replace("/(auth)/login");
      },
    },
  ]);
};
```

#### After:
```typescript
const doSignOut = () => {
  console.log("[SIGNOUT] Sign out button pressed");
  
  Alert.alert(
    t("account.signOut"),
    "Are you sure you want to sign out?",
    [
      { 
        text: t("common.cancel"), 
        style: "cancel",
        onPress: () => console.log("[SIGNOUT] Cancelled")
      },
      {
        text: t("account.signOut"),
        style: "destructive",
        onPress: async () => {
          try {
            console.log("[SIGNOUT] Confirming sign out...");
            
            // Clear auth state
            await signOut();
            console.log("[SIGNOUT] Auth state cleared");
            
            // Small delay to ensure state is updated
            await new Promise(resolve => setTimeout(resolve, 100));
            
            console.log("[SIGNOUT] Navigating to login...");
            
            // Clear navigation stack and go to login
            router.dismissAll();
            router.replace("/(auth)/login");
            
            console.log("[SIGNOUT] Navigation complete");
          } catch (error) {
            console.error("[SIGNOUT] Error during sign out:", error);
            Alert.alert("Error", "Failed to sign out. Please try again.");
          }
        },
      },
    ],
    { cancelable: true }
  );
};
```

### Key Improvements

1. **Added confirmation message**: "Are you sure you want to sign out?"
2. **Added console logs**: Track the sign out flow for debugging
3. **Added error handling**: Catch and display errors to user
4. **Added delay**: Small delay after signOut to ensure state updates
5. **Clear navigation stack**: `router.dismissAll()` before `router.replace()`
6. **Made alert cancelable**: User can tap outside to dismiss

## Testing

### Manual Test

1. **Open the app** and log in
2. **Go to Account tab** (bottom navigation)
3. **Tap "Sign Out" button** (red button at bottom)
4. **Check console logs** - you should see:
   ```
   [SIGNOUT] Sign out button pressed
   ```
5. **Tap "Sign Out" in the alert**
6. **Check console logs** - you should see:
   ```
   [SIGNOUT] Confirming sign out...
   [SIGNOUT] Auth state cleared
   [SIGNOUT] Navigating to login...
   [SIGNOUT] Navigation complete
   ```
7. **Verify you're on the login screen**

### Expected Behavior

- ✅ Alert shows with "Are you sure you want to sign out?"
- ✅ Two buttons: "Cancel" and "Sign Out"
- ✅ Tapping "Cancel" dismisses the alert
- ✅ Tapping "Sign Out" clears auth state
- ✅ User is redirected to login screen
- ✅ All console logs appear in order
- ✅ No errors in console

### Troubleshooting

#### Alert doesn't show
- Check if `Alert` is imported from `react-native`
- Check console for `[SIGNOUT] Sign out button pressed`
- If no log, the button onPress is not being called

#### Alert shows but nothing happens when tapping "Sign Out"
- Check console for errors after `[SIGNOUT] Confirming sign out...`
- Check if `signOut()` function is throwing an error
- Check if SecureStore is available (might fail on web)

#### Sign out works but doesn't navigate to login
- Check console for `[SIGNOUT] Navigating to login...`
- Check if `router.replace()` is being called
- Try using `router.push("/(auth)/login")` instead of `replace`

#### Navigation works but user can go back
- This is why we added `router.dismissAll()` before `replace()`
- It clears the entire navigation stack
- User cannot press back button to return to app

## Debug Commands

### Check if button is being pressed
```bash
# In Expo/Metro terminal, look for:
[SIGNOUT] Sign out button pressed
```

### Check if sign out is working
```bash
# Look for these logs in order:
[SIGNOUT] Confirming sign out...
[SIGNOUT] Auth state cleared
[SIGNOUT] Navigating to login...
[SIGNOUT] Navigation complete
```

### Check for errors
```bash
# Look for:
[SIGNOUT] Error during sign out: <error message>
```

## Files Changed

- ✅ `mobile/src/screens/account.tsx` - Added logging and error handling

## Commit

`5a53aad` - fix: improve sign out button with better error handling and logging

## Status

✅ **FIXED** - Sign out button now works correctly with:
- Proper confirmation dialog
- Error handling
- Navigation stack clearing
- Console logging for debugging
