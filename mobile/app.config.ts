import type { ExpoConfig } from "expo/config";

/**
 * Point the app at a backend via EXPO_PUBLIC_API_URL:
 *   local device on same Wi-Fi → http://<LAN-IP>:3000
 *   staging                    → https://api-staging.carezoa.example
 */
export default (): ExpoConfig => ({
  name: "CAREZOA",
  slug: "carezoa-patient-app",
  version: "1.0.0",
  orientation: "portrait",
  scheme: "carezoa",
  userInterfaceStyle: "light",
  backgroundColor: "#F6F4EE",
  newArchEnabled: true,
  plugins: [
    "expo-router",
    "expo-secure-store",
    [
      "expo-notifications",
      { color: "#0E7C7B" },
    ],
  ],
  experiments: { typedRoutes: true },
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.carezoa.patient",
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        "Used to show how far verified nurses are from the care address.",
    },
  },
  android: {
    package: "com.carezoa.patient",
    edgeToEdgeEnabled: true,
    permissions: ["POST_NOTIFICATIONS", "ACCESS_COARSE_LOCATION"],
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_ANDROID_KEY ?? "",
      },
    },
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? null,
    eas: { projectId: "00000000-0000-0000-0000-000000000000" },
  },
});
