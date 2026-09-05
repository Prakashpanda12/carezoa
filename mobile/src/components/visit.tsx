import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Booking, VisitStatus } from "../types/api";
import { dayLabel, timeOf } from "../utils/format";
import { Chip, cx } from "./ui";

export const STATUS_TONE: Record<VisitStatus, "neutral" | "brand" | "success" | "warn" | "danger"> = {
  scheduled: "warn",
  confirmed: "brand",
  en_route: "brand",
  checked_in: "brand",
  in_service: "brand",
  completed: "success",
  cancelled: "danger",
};

export function StatusChip({ status, t }: { status: VisitStatus; t: (k: string) => string }) {
  return <Chip tone={STATUS_TONE[status]} label={t(`visit.${status}`)} />;
}

export function VisitStatusTimeline({
  booking,
}: {
  booking: Booking;
}) {
  const activeIdxRaw = booking.timeline.findIndex(
    (e) => e.key === booking.status && e.at !== null,
  );
  const activeIdx =
    booking.status === "cancelled"
      ? -1
      : activeIdxRaw === -1
        ? booking.timeline.findLastIndex((e) => e.at !== null)
        : activeIdxRaw;

  return (
    <View>
      {booking.timeline.map((e, i) => {
        const done = activeIdx >= 0 && i <= activeIdx && !!e.at;
        const active = i === activeIdx && booking.status !== "completed";
        return (
          <View key={e.key} className="flex-row">
            <View className="items-center">
              <View
                className={cx(
                  "h-6 w-6 items-center justify-center rounded-full",
                  done ? "bg-brand" : "border border-line bg-card",
                  active && "border-2 border-brand bg-brand/10",
                )}
              >
                {done && <Ionicons name="checkmark" size={13} color="#fff" />}
                {active && !done && <View className="h-2.5 w-2.5 rounded-full bg-brand" />}
              </View>
              {i < booking.timeline.length - 1 && (
                <View className={cx("w-px flex-1", done ? "bg-brand" : "bg-line")} />
              )}
            </View>
            <View className="ml-3 pb-5">
              <Text
                className={cx(
                  "text-[14px] font-semibold",
                  done || active ? "text-ink" : "text-faint",
                )}
              >
                {e.label}
              </Text>
              {e.at && (
                <Text className="text-[11.5px] text-faint">
                  {dayLabel(e.at)} · {timeOf(e.at)}
                </Text>
              )}
            </View>
          </View>
        );
      })}
      {booking.status === "cancelled" && (
        <Chip tone="danger" icon="close-circle" label="Cancelled" />
      )}
    </View>
  );
}

/**
 * Display-only OTP card. The family shares the code VERBALLY at the door —
 * this is an anti-bypass control: providers never receive it via any API.
 */
export function OTPHint({ otp, t }: { otp: string | null; t: (k: string) => string }) {
  if (!otp) {
    return (
      <View className="flex-row items-center gap-3 rounded-xl3 border border-dashed border-line bg-card p-4">
        <Ionicons name="key-outline" size={18} color="#9AA5A2" />
        <Text className="flex-1 text-[12.5px] text-soft">{t("visit.noOTP")}</Text>
      </View>
    );
  }
  return (
    <View className="rounded-xl3 bg-ink p-4">
      <View className="flex-row items-center gap-2">
        <Ionicons name="key" size={13} color="#E0F0EF" />
        <Text className="text-[11px] font-bold uppercase tracking-widest text-paper/60">
          {t("visit.otpTitle")}
        </Text>
      </View>
      <View className="mt-2 flex-row gap-2.5">
        {otp.split("").map((d, i) => (
          <View key={i} className="h-12 w-11 items-center justify-center rounded-xl bg-white/10">
            <Text className="text-[22px] font-bold text-paper">{d}</Text>
          </View>
        ))}
      </View>
      <Text className="mt-2.5 text-[11.5px] leading-relaxed text-paper/50">
        {t("visit.otpBody")}
      </Text>
    </View>
  );
}

export function BookingCard({
  booking,
  onPress,
  t,
  rightBadge,
}: {
  booking: Booking;
  onPress: () => void;
  t: (k: string) => string;
  rightBadge?: React.ReactNode;
}) {
  return (
    <View className="mb-3 rounded-xl3 border border-line bg-card p-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-[15px] font-bold text-ink" numberOfLines={1}>
          {booking.service?.name ?? "Visit"}
        </Text>
        <StatusChip status={booking.status} t={t} />
      </View>
      <Text className="mt-0.5 text-[12.5px] text-soft">
        {booking.provider?.name} · for {booking.patient.name}
      </Text>
      <View className="mt-2.5 flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="time-outline" size={12} color="#9AA5A2" />
          <Text className="text-[12px] font-semibold text-soft">
            {dayLabel(booking.startsAt)} · {timeOf(booking.startsAt)}
          </Text>
        </View>
        {rightBadge}
      </View>
    </View>
  );
}
