import "../src/theme/globals.css";
import "../src/i18n";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { makeQueryClient } from "../src/api/hooks";
import { useAuth } from "../src/store/auth";
import { applySavedLanguage } from "../src/i18n";
import { api } from "../src/api/client";
import { requestNotificationPermissions, getExpoPushToken } from "../src/utils/notifications";

export default function RootLayout() {
  const [queryClient] = useState(makeQueryClient);
  const router = useRouter();
  const segments = useSegments();
  const { hydrated, token, hydrate, setPatient } = useAuth();

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

  // auth guard
  useEffect(() => {
    if (!hydrated) return;
    const inAuthGroup = segments[0] === "(auth)";
    if (!token && !inAuthGroup) {
      router.replace("/(auth)/onboarding");
    } else if (token && inAuthGroup) {
      router.replace("/(tabs)/home");
    }
  }, [hydrated, token, segments, router]);

  if (!hydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-paper">
        <ActivityIndicator size="large" color="#0E7C7B" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
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
