import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useRecords } from "../api/hooks";
import { can, useAuth } from "../store/auth";
import { bookingToDraft, useBookingDraft } from "../store/bookingDraft";
import { dayLabel } from "../utils/format";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Header,
  LoadingState,
  Screen,
} from "../components/ui";
import { ProviderPhoto } from "../components/provider";

export function CareRecords() {
  const { t } = useTranslation();
  const router = useRouter();
  const viewer = useAuth((s) => s.viewer);
  const records = useRecords();
  const updateDraft = useBookingDraft((s) => s.update);

  // Access control: viewer mode honors the API-granted accessScope exactly.
  if (viewer && !can(viewer, "viewRecords")) {
    return (
      <Screen>
        <Header title={t("records.title")} />
        <EmptyState icon="lock-closed" title={t("records.lockedTitle")} body={t("records.lockedBody")} />
      </Screen>
    );
  }

  if (records.isLoading) return <LoadingState label={t("common.loading")} />;
  if (records.isError) return <ErrorState label="Couldn't load records." onRetry={() => records.refetch()} />;

  return (
    <Screen onRefresh={() => records.refetch()} refreshing={records.isRefetching}>
      <Header title={t("records.title")} subtitle="Reports from completed visits" />
      {(records.data?.items.length ?? 0) === 0 && (
        <EmptyState icon="document-text-outline" title="No records yet" body={t("records.empty")} />
      )}
      {records.data?.items.map((r) => (
        <Card key={r.id} className="mb-3">
          <View className="flex-row items-center gap-3">
            <ProviderPhoto name={r.booking.provider?.name ?? ""} photoColor={r.booking.provider?.photoColor ?? "moss"} size={42} />
            <View className="flex-1">
              <Text className="text-[14.5px] font-bold text-ink" numberOfLines={1}>
                {r.booking.service?.name}
              </Text>
              <Text className="text-[12px] text-soft">
                {r.booking.provider?.name} · {dayLabel(r.booking.startsAt)} · for {r.booking.patient.name}
              </Text>
            </View>
          </View>
          <Text className="mt-3 text-[13.5px] leading-relaxed text-ink">{r.summary}</Text>
          {Object.keys(r.vitals).length > 0 && (
            <View className="mt-3 flex-row flex-wrap gap-2">
              {Object.entries(r.vitals).map(([k, v]) => (
                <View key={k} className="rounded-xl bg-brand-soft px-3 py-1.5">
                  <Text className="text-[10px] font-bold text-brand-dark/70">{k}</Text>
                  <Text className="text-[12.5px] font-bold text-brand-dark">{v}</Text>
                </View>
              ))}
            </View>
          )}
          <View className="mt-3.5 flex-row items-center gap-2 border-t border-line pt-3">
            <View className="flex-1">
              <Button
                title={t("visit.report")}
                small
                variant="ghost"
                icon="document-text-outline"
                onPress={() => router.push(`/visit/${r.booking.id}`)}
              />
            </View>
            <View className="flex-1">
              <Button
                title={t("common.bookAgain")}
                small
                variant="primary"
                icon="repeat"
                onPress={() => {
                  updateDraft(bookingToDraft(r.booking));
                  router.push("/booking");
                }}
              />
            </View>
          </View>
        </Card>
      ))}
      <View className="mt-2 flex-row items-center gap-2 px-1">
        <Ionicons name="shield-checkmark-outline" size={12} color="#9AA5A2" />
        <Text className="flex-1 text-[11px] text-faint">
          Reports are written by verified providers and checked by the CAREZOA clinical team.
        </Text>
      </View>
    </Screen>
  );
}
