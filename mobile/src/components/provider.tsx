import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ProviderSummary, Service } from "../types/api";
import { providerPhotoColors } from "../theme/tokens";
import { Avatar, Chip, Stars, cx } from "./ui";

export function ProviderPhoto({
  name,
  photoColor,
  size = 56,
}: {
  name: string;
  photoColor: string;
  size?: number;
}) {
  return <Avatar name={name} size={size} color={providerPhotoColors[photoColor] ?? "#0E7C7B"} />;
}

export function ProviderRatingSummary({
  rating,
  count,
}: {
  rating: number;
  count: number;
}) {
  return (
    <View className="flex-row items-center gap-1.5">
      <Ionicons name="star" size={13} color="#C98A1B" />
      <Text className="text-[13px] font-bold text-ink">{rating.toFixed(1)}</Text>
      <Text className="text-[12px] text-faint">({count})</Text>
    </View>
  );
}

export function ProviderCard({
  provider,
  onPress,
}: {
  provider: ProviderSummary;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      className="mb-3 rounded-xl3 border border-line bg-card p-4"
    >
      <View className="flex-row items-center gap-3">
        <ProviderPhoto name={provider.name} photoColor={provider.photoColor} />
        <View className="flex-1">
          <View className="flex-row items-center gap-1.5">
            <Text className="text-[15px] font-bold text-ink" numberOfLines={1}>
              {provider.name}
            </Text>
            {provider.verified && (
              <Ionicons name="checkmark-circle" size={14} color="#0E7C7B" />
            )}
          </View>
          <Text className="text-[12px] text-soft" numberOfLines={1}>
            {provider.title} · {provider.qualifications[0] ?? ""}
          </Text>
          <View className="mt-1.5 flex-row items-center gap-3">
            <ProviderRatingSummary rating={provider.rating} count={provider.reviewsCount} />
            {provider.distanceKm != null && (
              <Text className="text-[11.5px] font-medium text-faint">
                {provider.distanceKm.toFixed(1)} km
              </Text>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#9AA5A2" />
      </View>
    </TouchableOpacity>
  );
}

export function ServiceTile({
  service,
  selected,
  onPress,
  compact = false,
}: {
  service: Pick<Service, "name" | "icon" | "description">;
  selected?: boolean;
  onPress?: () => void;
  compact?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className={cx(
        "rounded-2xl border p-3.5",
        selected ? "border-brand bg-brand-soft" : "border-line bg-card",
        compact ? "w-[110px]" : "flex-1",
      )}
    >
      <View
        className={cx(
          "mb-2 h-9 w-9 items-center justify-center rounded-xl",
          selected ? "bg-brand" : "bg-brand-soft",
        )}
      >
        <Ionicons
          name={(service.icon as keyof typeof Ionicons.glyphMap) ?? "medkit"}
          size={17}
          color={selected ? "#fff" : "#0E7C7B"}
        />
      </View>
      <Text
        className={cx("text-[12.5px] font-bold leading-tight", selected ? "text-brand-dark" : "text-ink")}
        numberOfLines={2}
      >
        {service.name}
      </Text>
    </TouchableOpacity>
  );
}

export function ReviewRow({
  authorName,
  rating,
  text,
}: {
  authorName: string;
  rating: number;
  text: string;
}) {
  return (
    <View className="border-b border-line py-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-[13px] font-bold text-ink">{authorName}</Text>
        <Stars rating={rating} />
      </View>
      <Text className="mt-1 text-[13px] leading-relaxed text-soft">{text}</Text>
    </View>
  );
}
