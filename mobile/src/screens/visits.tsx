import React, { useState } from "react";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useBookings } from "../api/hooks";
import { can, useAuth } from "../store/auth";
import {
  EmptyState,
  Header,
  LoadingState,
  ErrorState,
  Screen,
  Segmented,
} from "../components/ui";
import { BookingCard } from "../components/visit";

export function UpcomingVisits() {
  const { t } = useTranslation();
  const router = useRouter();
  const viewer = useAuth((s) => s.viewer);
  const [scope, setScope] = useState<"upcoming" | "past">("upcoming");
  const bookings = useBookings(scope, scope === "upcoming" ? 15_000 : undefined);

  if (viewer && !can(viewer, "viewVisits")) {
    return (
      <Screen>
        <Header title={t("tabs.visits")} />
        <EmptyState icon="lock-closed" title={t("records.lockedTitle")} body={t("records.lockedBody")} />
      </Screen>
    );
  }

  return (
    <Screen
      onRefresh={() => bookings.refetch()}
      refreshing={bookings.isRefetching}
    >
      <Header title={t("tabs.visits")} subtitle="Your booked care, live" />
      <Segmented
        options={[
          { value: "upcoming", label: t("home.upcoming") },
          { value: "past", label: "Past" },
        ]}
        value={scope}
        onChange={setScope}
      />
      <View className="mt-4">
        {bookings.isLoading && <LoadingState />}
        {bookings.isError && (
          <ErrorState label="Couldn't load visits." onRetry={() => bookings.refetch()} />
        )}
        {bookings.data?.items.length === 0 && (
          <EmptyState
            icon="calendar-outline"
            title={scope === "upcoming" ? "No upcoming visits" : "No past visits"}
            body={
              scope === "upcoming"
                ? "Book a verified nurse, attendant or physio in under a minute."
                : "Completed visits appear here with their care reports."
            }
          />
        )}
        {bookings.data?.items.map((b) => (
          <BookingCard key={b.id} booking={b} t={t} onPress={() => router.push(`/visit/${b.id}`)} />
        ))}
      </View>
    </Screen>
  );
}
