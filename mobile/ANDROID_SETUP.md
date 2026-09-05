# Android Device Setup Guide

## Prerequisites
- Next.js backend running on port 3000
- Android device and computer on the same WiFi network
- USB debugging enabled on Android device (for USB connection)

## Step 1: Start the Backend

```bash
cd /home/user/carezoa
npm run dev
```

The backend should start on `http://localhost:3000`

## Step 2: Find Your Computer's LAN IP Address

**macOS/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
# or
ip addr show | grep "inet " | grep -v 127.0.0.1
```

**Windows:**
```bash
ipconfig | findstr IPv4
```

Look for an IP like `192.168.1.100` or `10.0.0.50`

## Step 3: Configure the Mobile App

Edit `.env` in the mobile directory:

```bash
# Replace 192.168.1.100 with YOUR computer's IP address
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
```

## Step 4: Start the Mobile App

```bash
cd /home/user/carezoa/mobile
npm start
```

Scan the QR code with Expo Go app on your Android device.

## Troubleshooting

### "Network request failed" error

1. **Check if backend is accessible from your phone:**
   - Open browser on your phone
   - Navigate to `http://YOUR_COMPUTER_IP:3000/api/v1/health`
   - You should see a response

2. **Check firewall settings:**
   ```bash
   # macOS
   sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off
   
   # Linux (UFW)
   sudo ufw allow 3000/tcp
   
   # Windows
   # Add inbound rule for port 3000 in Windows Firewall
   ```

3. **Verify both devices are on same WiFi:**
   - Check your phone's WiFi settings
   - Check your computer's network settings
   - Both should show the same network name

### "Unable to resolve host" error

1. **For Android Emulator:**
   - Use `10.0.2.2` instead of `localhost`
   - The `.env` should have: `EXPO_PUBLIC_API_URL=http://10.0.2.2:3000`

2. **For Physical Device:**
   - Make sure you're using the LAN IP, not `localhost` or `127.0.0.1`
   - Verify the IP hasn't changed (DHCP can reassign IPs)

### Backend not starting

1. **Check if port 3000 is already in use:**
   ```bash
   lsof -i :3000
   # or
   netstat -ano | findstr :3000
   ```

2. **Kill the process or use a different port:**
   ```bash
   # Kill process
   kill -9 <PID>
   
   # Or start on different port
   PORT=3001 npm run dev
   ```

3. **Update `.env` to match:**
   ```bash
   EXPO_PUBLIC_API_URL=http://YOUR_IP:3001
   ```

## Testing the Connection

Once everything is set up, test the login flow:

1. Open the app on your Android device
2. Enter a phone number (e.g., `+1234567890`)
3. Tap "Send OTP"
4. Use the dev code: `123456`
5. You should be logged in successfully

If you see any errors, check the Expo terminal and Next.js terminal for error messages.

## Common Issues

| Issue | Solution |
|-------|----------|
| Login hangs indefinitely | Backend not accessible - check IP and firewall |
| "Invalid OTP" error | Backend is running but OTP endpoint has issue - check backend logs |
| Maps not showing | Missing `GOOGLE_MAPS_ANDROID_KEY` in `.env` |
| App crashes on startup | Check Metro bundler logs for errors |

## Quick Reference

**Emulator:**
```bash
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```

**Physical Device:**
```bash
EXPO_PUBLIC_API_URL=http://192.168.1.XXX:3000
```

**iOS Simulator / Web:**
```bash
EXPO_PUBLIC_API_URL=http://localhost:3000
```
