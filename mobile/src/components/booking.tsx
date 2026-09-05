import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { dowShort, monthShort } from "../utils/format";
import { cx } from "./ui";

const STEP_KEYS = ["booking.stepWhen", "booking.stepDetails", "booking.stepReview"] as const;

export function BookingStepper({ step, t }: { step: number; t: (k: string) => string }) {
  return (
    <View className="mb-5 flex-row items-center">
      {STEP_KEYS.map((key, i) => (
        <React.Fragment key={key}>
          <View className="items-center">
            <View
              className={cx(
                "h-7 w-7 items-center justify-center rounded-full",
                i < step ? "bg-brand" : i === step ? "border-2 border-brand bg-card" : "bg-ink/10",
              )}
            >
              <Text
                className={cx(
                  "text-[11px] font-bold",
                  i < step ? "text-white" : i === step ? "text-brand" : "text-faint",
                )}
              >
                {i + 1}
              </Text>
            </View>
            <Text
              className={cx(
                "mt-1 text-[10px] font-semibold",
                i === step ? "text-ink" : "text-faint",
              )}
            >
              {t(key)}
            </Text>
          </View>
          {i < STEP_KEYS.length - 1 && (
            <View className={cx("mx-2 mb-4 h-px flex-1", i < step ? "bg-brand" : "bg-line")} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

export function DayPicker({
  days,
  value,
  onChange,
}: {
  days: Date[];
  value: string | null; // ISO date (day)
  onChange: (isoDay: string) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 pr-5">
      {days.map((d) => {
        const iso = d.toISOString().slice(0, 10);
        const active = value === iso;
        return (
          <TouchableOpacity
            key={iso}
            onPress={() => onChange(iso)}
            className={cx(
              "w-[62px] items-center rounded-2xl border px-2 py-3",
              active ? "border-ink bg-ink" : "border-line bg-card",
            )}
          >
            <Text className={cx("text-[10px] font-bold uppercase", active ? "text-paper/60" : "text-faint")}>
              {dowShort(d)}
            </Text>
            <Text className={cx("text-[18px] font-bold", active ? "text-paper" : "text-ink")}>
              {d.getDate()}
            </Text>
            <Text className={cx("text-[10px] font-semibold", active ? "text-paper/60" : "text-faint")}>
              {monthShort(d)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

export const TIME_SLOTS = ["08:00", "09:00", "10:00", "11:30", "13:00", "15:00", "16:30", "18:00"];

export function SlotPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (slot: string) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {TIME_SLOTS.map((s) => {
        const active = value === s;
        return (
          <TouchableOpacity
            key={s}
            onPress={() => onChange(s)}
            className={cx(
              "rounded-xl border px-4 py-2.5",
              active ? "border-ink bg-ink" : "border-line bg-card",
            )}
          >
            <Text className={cx("text-[13px] font-bold", active ? "text-paper" : "text-soft")}>
              {s}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
