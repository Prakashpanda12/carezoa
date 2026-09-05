import "../src/theme/globals.css";
import "../src/i18n";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { makeQueryClient } from "../src/api/hooks";
import { useAuth } from "../src/store/auth";
import { applySavedLanguage } from "../src/i18n";
import { api } from "../src/api/client";
import { requestNotificationPermissions, getExpoPushToken } from "../src/utils/notifications";
import { OfflineBanner } from "../src/components/ui";

export default function RootLayout() {
  const [queryClient] = useState(makeQueryClient);
  const router = useRouter();
  const segments = useSegments();
  const { hydrated, token, hydrate, setPatient } = useAuth();
  // BUG-H06 fix: track whether we've done the initial auth redirect to prevent flash
  const initialRedirectDone = useRef(false);

  // boot: restore token from SecureStore, language from AsyncStorage,
  // and request push permissions.
  useEffect(() => {
    void hydrate();
    void applySavedLanguage();
    // Request notification permissions (safe for Expo Go)
    requestNotificationPermissions()
      .then((granted) => {
        if (granted) {
          return getExpoPushToken();
        }
        return null;
      })
      .catch(() => null);
  }, [hydrate]);

  // once a token exists, refresh the profile so headers/personalization are real
  useEffect(() => {
    if (!token) return;
    api
      .getProfile()
      .then(setPatient)
      .catch(() => {});
  }, [token, setPatient]);

  // BUG-H06 fix: auth guard with initial redirect tracking to prevent flash
  useEffect(() => {
    if (!hydrated) return;
    const inAuthGroup = segments[0] === "(auth)";
    if (!token && !inAuthGroup) {
      router.replace("/(auth)/signup");
      initialRedirectDone.current = true;
    } else if (token && inAuthGroup) {
      router.replace("/(tabs)/home");
      initialRedirectDone.current = true;
    } else {
      initialRedirectDone.current = true;
    }
  }, [hydrated, token, segments, router]);

  // BUG-H06 fix: show branded splash while hydrating + initial redirect
  if (!hydrated || !initialRedirectDone.current) {
    return (
      <View className="flex-1 items-center justify-center bg-paper">
        <View className="h-20 w-20 items-center justify-center rounded-full" style={{ backgroundColor: "rgba(14,124,123,0.12)" }}>
          <Text className="text-[24px] font-bold" style={{ color: "#0E7C7B" }}>C</Text>
        </View>
        <ActivityIndicator size="small" color="#0E7C7B" style={{ marginTop: 16 }} />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      {/* BUG-M09 fix: offline indicator */}
      <OfflineBanner />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="booking" options={{ presentation: "card" }} />
        <Stack.Screen name="payment" options={{ presentation: "card", gestureEnabled: false }} />
        <Stack.Screen name="payment-success" options={{ presentation: "fullScreenModal", gestureEnabled: false }} />
        <Stack.Screen name="chat/[id]" options={{ presentation: "card" }} />
      </Stack>
    </QueryClientProvider>
  );
}
