import React, { useEffect, useRef } from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import * as Notifications from "expo-notifications";
import { useBookings } from "../../src/api/hooks";

/**
 * Watches visit statuses (polled) and raises local notifications for the
 * moments families care about: provider en route, check-in, completion.
 * In production these arrive as remote pushes from the backend.
 */
function useVisitNotifications() {
  const { data } = useBookings("upcoming", 15_000);
  const prev = useRef<Record<number, string>>({});

  useEffect(() => {
    if (!data?.items) return;
    for (const b of data.items) {
      const last = prev.current[b.id];
      if (last && last !== b.status) {
        const messages: Record<string, { title: string; body: string }> = {
          en_route: { title: "Provider on the way", body: `${b.provider?.name} has started for ${b.service?.name}.` },
          checked_in: { title: "Provider checked in", body: `The visit with ${b.provider?.name} has begun safely.` },
          completed: { title: "Visit completed", body: "The care report is ready in Records." },
        };
        const msg = messages[b.status];
        if (msg) {
          Notifications.scheduleNotificationAsync({ content: msg, trigger: null }).catch(() => {});
        }
      }
      prev.current[b.id] = b.status;
    }
  }, [data]);
}

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  home: "home",
  visits: "calendar",
  records: "document-text",
  account: "person",
};

export default function TabsLayout() {
  const { t } = useTranslation();
  useVisitNotifications();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#0E7C7B",
        tabBarInactiveTintColor: "#9AA5A2",
        tabBarStyle: {
          position: "absolute",
          left: 16,
          right: 16,
          bottom: 16,
          height: 64,
          borderRadius: 22,
          backgroundColor: "#FDFDFB",
          borderTopWidth: 1,
          borderColor: "#E5E2D8",
          paddingBottom: 8,
          paddingTop: 6,
          elevation: 12,
        },
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: "700" },
        tabBarIcon: ({ color, focused }) => (
          <Ionicons
            name={TAB_ICONS[route.name] ?? "ellipse"}
            size={22}
            color={color}
            style={{ opacity: focused ? 1 : 0.85 }}
          />
        ),
      })}
    >
      <Tabs.Screen name="home" options={{ title: t("tabs.home") }} />
      <Tabs.Screen name="visits" options={{ title: t("tabs.visits") }} />
      <Tabs.Screen name="records" options={{ title: t("tabs.records") }} />
      <Tabs.Screen name="account" options={{ title: t("tabs.account") }} />
    </Tabs>
  );
}
