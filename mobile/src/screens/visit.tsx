import React, { useState } from "react";
import { Alert, Linking, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { scheduleNotification } from "../utils/notifications";
import { api } from "../api/client";
import { keys, useBooking, useRecords } from "../api/hooks";
import { can, useAuth } from "../store/auth";
import { bookingToDraft, useBookingDraft } from "../store/bookingDraft";
import { dayLabel, durationLabel, inr, timeOf } from "../utils/format";
import {
  Button,
  Card,
  Chip,
  ErrorState,
  Header,
  LoadingState,
} from "../components/ui";
import { OTPHint, StatusChip, VisitStatusTimeline } from "../components/visit";
import { ProviderPhoto } from "../components/provider";

const RESCHEDULE_OPTIONS = [1, 2].flatMap((dayIn) =>
  ["10:00", "15:30"].map((slot) => ({ dayIn, slot })),
);

export function VisitDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const qc = useQueryClient();
  const viewer = useAuth((s) => s.viewer);
  const booking = useBooking(id ?? "", 10_000);
  const records = useRecords();
  const updateDraft = useBookingDraft((s) => s.update);

  const [busy, setBusy] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);

  const record = records.data?.items.find((r) => r.booking.id === Number(id));

  const refresh = () => {
    qc.invalidateQueries({ queryKey: keys.booking(id ?? "") });
    qc.invalidateQueries({ queryKey: keys.bookings("upcoming") });
    qc.invalidateQueries({ queryKey: keys.bookings("past") });
  };

  const maskedCall = async () => {
    try {
      const res = await api.maskedCall(id!);
      Alert.alert(
        t("visit.callVia"),
        `Relay: ${res.maskedNumber}\n${t("visit.maskedNote")}`,
        [
          { text: t("common.cancel"), style: "cancel" },
          { text: "Call", onPress: () => Linking.openURL(`tel:${res.maskedNumber.replace(/\s/g, "")}`).catch(() => {}) },
        ],
      );
    } catch (e) {
      Alert.alert("Couldn't start call", "Please try again later.");
    }
  };

  const cancelVisit = () => {
    Alert.alert(t("visit.cancelVisit"), "This can't be undone.", [
      { text: t("common.back"), style: "cancel" },
      {
        text: t("visit.cancelVisit"),
        style: "destructive",
        onPress: async () => {
          try {
            await api.patchBooking(id!, { action: "cancel" });
            refresh();
          } catch (e) {
            Alert.alert("Couldn't cancel", "Please try again later.");
          }
        },
      },
    ]);
  };

  const reschedule = async (option: { dayIn: number; slot: string }) => {
    setShowReschedule(false);
    setBusy(true);
    try {
      const d = new Date(Date.now() + option.dayIn * 86_400_000);
      const [h, m] = option.slot.split(":").map(Number);
      d.setHours(h, m, 0, 0);
      await api.patchBooking(id!, { action: "reschedule", startsAt: d.toISOString() });
      refresh();
    } catch (e) {
      Alert.alert("Couldn't reschedule", "Please try again later.");
    } finally {
      setBusy(false);
    }
  };

  const simulate = async () => {
    setBusy(true);
    try {
      const before = booking.data?.status;
      const next = await api.simAdvance(id!);
      refresh();
      if (next.status !== before && next.status === "en_route") {
        scheduleNotification(
          "Your provider is on the way",
          `${next.provider?.name} has started for the visit.`
        ).catch(() => {});
      }
      if (next.status !== before && next.status === "completed") {
        scheduleNotification(
          "Visit completed",
          "The care report is ready in Records."
        ).catch(() => {});
        qc.invalidateQueries({ queryKey: keys.records });
      }
    } catch (e) {
      Alert.alert("Simulator", "Could not advance visit status.");
    } finally {
      setBusy(false);
    }
  };

  const bookAgain = () => {
    if (!booking.data) return;
    updateDraft(bookingToDraft(booking.data));
    router.push("/booking");
  };

  if (booking.isLoading) return <LoadingState label={t("common.loading")} />;
  if (booking.isError || !booking.data)
    return <ErrorState label="Couldn't load this visit." onRetry={() => booking.refetch()} />;

  const b = booking.data;
  const live = ["en_route", "checked_in", "in_service"].includes(b.status);
  const canCancel = ["scheduled", "confirmed"].includes(b.status);
  const completed = b.status === "completed";
  const cancelled = b.status === "cancelled";
  // Unified: show bottom rail for ALL actionable states, but with correct actions
  const showBottomRail = canCancel || live || completed;

  return (
    <View className="flex-1 bg-paper">
      <ScrollView contentContainerClassName="px-5 pb-40 pt-2" showsVerticalScrollIndicator={false}>
        <Header title={b.service?.name ?? "Visit"} subtitle={`${t("booking.provider")}: ${b.provider?.name ?? ""}`} onBack={() => router.back()} />

        {/* status + otp */}
        <View className="mb-4 flex-row items-center justify-between">
          <StatusChip status={b.status} t={t} />
          {live && <Chip tone="brand" icon="pulse" label="LIVE" />}
        </View>
        {!cancelled && <OTPHint otp={b.checkinOtp} t={t} />}

        {/* provider + actions */}
        <Card className="mt-4">
          <View className="flex-row items-center gap-3">
            <ProviderPhoto name={b.provider?.name ?? ""} photoColor={b.provider?.photoColor ?? "moss"} size={48} />
            <View className="flex-1">
              <Text className="text-[15px] font-bold text-ink">{b.provider?.name}</Text>
              <Text className="text-[12px] text-soft">{b.provider?.title}</Text>
            </View>
          </View>
          {!completed && !cancelled && (
            <View className="mt-3 flex-row gap-2">
              <View className="flex-1">
                <Button title={t("visit.callVia")} small icon="call" variant="secondary" onPress={maskedCall} testID="masked-call" accessibilityLabel="Call provider via masked relay" />
              </View>
              {(!viewer || can(viewer, "chat")) && (
                <View className="flex-1">
                  <Button title={t("visit.messageProvider")} small icon="chatbox-ellipses" variant="ghost" onPress={() => router.push(`/chat/${b.id}`)} accessibilityLabel="Send message to provider" />
                </View>
              )}
            </View>
          )}
        </Card>

        {/* timeline */}
        <Text className="mb-2.5 mt-6 text-[12px] font-bold uppercase tracking-widest text-faint">
          {t("visit.timeline")}
        </Text>
        <Card>
          <VisitStatusTimeline booking={b} />
        </Card>

        {/* details */}
        <Text className="mb-2.5 mt-6 text-[12px] font-bold uppercase tracking-widest text-faint">
          {t("visit.details")}
        </Text>
        <Card>
          <DetailRow icon="person" label="Patient" value={`${b.patient.name} · ${b.patient.age}${b.patient.gender ? ` · ${b.patient.gender}` : ""}`} />
          <DetailRow icon="time" label="When" value={`${dayLabel(b.startsAt)} · ${timeOf(b.startsAt)} · ${durationLabel(b.durationMin)}`} />
          <DetailRow icon="home" label="Where" value={`${b.address}, ${b.city}`} />
          {!!b.instructions && <DetailRow icon="create" label="Notes" value={b.instructions} />}
          <DetailRow icon="card" label="Amount" value={`${inr(b.amountInr)} · ${b.paymentStatus === "paid" ? "Paid" : b.paymentStatus}`} />
        </Card>

        {/* care report */}
        {completed && record && (
          <>
            <Text className="mb-2.5 mt-6 text-[12px] font-bold uppercase tracking-widest text-faint">
              {t("visit.report")}
            </Text>
            <Card>
              <Text className="text-[14px] leading-relaxed text-ink">{record.summary}</Text>
              {Object.keys(record.vitals).length > 0 && (
                <>
                  <Text className="mb-2 mt-4 text-[11px] font-bold uppercase tracking-widest text-faint">
                    {t("visit.vitals")}
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {Object.entries(record.vitals).map(([k, v]) => (
                      <View key={k} className="rounded-xl bg-brand-soft px-3 py-2">
                        <Text className="text-[11px] font-bold text-brand-dark/70">{k}</Text>
                        <Text className="text-[13px] font-bold text-brand-dark">{v}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
              {!!record.notes && <Text className="mt-3 text-[12.5px] italic text-soft">{record.notes}</Text>}
            </Card>
          </>
        )}
      </ScrollView>

      {/* unified bottom action rail — only one renders based on status */}
      {showBottomRail && (
        <View className="absolute inset-x-0 bottom-0 border-t border-line bg-card/95 px-5 pb-8 pt-3">
          {showReschedule ? (
            <View>
              <Text className="mb-2 text-[11px] font-bold uppercase tracking-widest text-faint">
                {t("visit.reschedule")}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {RESCHEDULE_OPTIONS.map((o) => (
                  <TouchableOpacity
                    key={`${o.dayIn}-${o.slot}`}
                    onPress={() => reschedule(o)}
                    className="rounded-xl border border-line bg-card px-3.5 py-2.5"
                    accessibilityLabel={`Reschedule to ${o.dayIn === 1 ? "tomorrow" : "in 2 days"} at ${o.slot}`}
                  >
                    <Text className="text-[12.5px] font-bold text-ink">
                      {o.dayIn === 1 ? "Tomorrow" : "In 2 days"} · {o.slot}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : canCancel ? (
            /* scheduled/confirmed: cancel, reschedule, simulate */
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Button title={t("visit.reschedule")} small variant="ghost" icon="calendar-outline" onPress={() => setShowReschedule(true)} accessibilityLabel="Reschedule this visit" />
              </View>
              <View className="flex-1">
                <Button title={t("visit.cancelVisit")} small variant="danger" icon="close" onPress={cancelVisit} accessibilityLabel="Cancel this visit" />
              </View>
              <View className="flex-1">
                <Button title={t("visit.simulate")} small variant="secondary" icon="play" loading={busy} onPress={simulate} testID="simulate-advance" accessibilityLabel="Simulate visit status advance" />
              </View>
            </View>
          ) : live ? (
            /* en_route / checked_in / in_service: simulate only */
            <Button title={t("visit.simulate")} small variant="secondary" icon="play" loading={busy} onPress={simulate} testID="simulate-advance" accessibilityLabel="Simulate visit status advance" />
          ) : completed ? (
            /* completed: book again + simulate */
            <View className="flex-row gap-2">
              <View className="flex-[1.5]">
                <Button title={t("common.bookAgain")} icon="repeat" onPress={bookAgain} testID="book-again" accessibilityLabel="Book this provider again with prefilled details" />
              </View>
              <View className="flex-1">
                <Button title={t("visit.simulate")} small variant="secondary" icon="play" loading={busy} onPress={simulate} accessibilityLabel="Simulate visit status advance" />
              </View>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

function DetailRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View className="flex-row gap-3 border-b border-line py-2.5 last:border-b-0">
      <Ionicons name={icon} size={15} color="#9AA5A2" style={{ marginTop: 1 }} />
      <View className="flex-1">
        <Text className="text-[11px] font-bold uppercase tracking-widest text-faint">{label}</Text>
        <Text className="mt-0.5 text-[13.5px] font-medium text-ink">{value}</Text>
      </View>
    </View>
  );
}
