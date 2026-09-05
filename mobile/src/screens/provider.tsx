import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import MapView, { Circle, Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useProvider } from "../api/hooks";
import { useBookingDraft } from "../store/bookingDraft";
import { inr, durationLabel } from "../utils/format";
import {
  Button,
  Card,
  Chip,
  ErrorState,
  Header,
  LoadingState,
  cx,
} from "../components/ui";
import {
  ProviderPhoto,
  ProviderRatingSummary,
  ReviewRow,
} from "../components/provider";

export function ProviderProfile() {
  const { id, serviceId } = useLocalSearchParams<{ id: string; serviceId?: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const provider = useProvider(id!);
  const update = useBookingDraft((s) => s.update);
  const presetServiceId = serviceId ? Number(serviceId) : null;

  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(presetServiceId);

  if (provider.isLoading) return <LoadingState label={t("common.loading")} />;
  if (provider.isError || !provider.data)
    return <ErrorState label="Couldn't load this provider." onRetry={() => provider.refetch()} />;

  const p = provider.data;
  const selected = p.services.find((s) => s.id === selectedServiceId) ?? p.services[0];

  const startBooking = () => {
    if (!selected) return;
    update({
      providerId: p.id,
      providerName: p.name,
      serviceId: selected.id,
      serviceName: selected.name,
      serviceDurationMin: selected.durationMin,
      priceInr: selected.basePriceInr,
      step: 0,
    });
    router.push("/booking");
  };

  return (
    <View className="flex-1 bg-paper">
      <ScrollView contentContainerClassName="pb-32" showsVerticalScrollIndicator={false}>
        <View className="px-5 pt-2">
          <Header title="" onBack={() => router.back()} />
        </View>

        {/* identity */}
        <View className="items-center px-5">
          <ProviderPhoto name={p.name} photoColor={p.photoColor} size={88} />
          <View className="mt-3 flex-row items-center gap-1.5">
            <Text className="text-[22px] font-bold text-ink">{p.name}</Text>
            {p.verified && <Ionicons name="checkmark-circle" size={19} color="#0E7C7B" />}
          </View>
          <Text className="text-[13px] text-soft">{p.title}</Text>
          <View className="mt-2 flex-row items-center gap-3">
            <ProviderRatingSummary rating={p.rating} count={p.reviewsCount} />
            <Chip tone="neutral" icon="briefcase-outline" label={t("provider.yearsExp", { count: p.yearsExp })} />
          </View>
          <View className="mt-3 flex-row flex-wrap justify-center gap-1.5">
            {p.languages.map((l) => (
              <Chip key={l} tone="brand" label={l} />
            ))}
          </View>
        </View>

        {/* coverage map */}
        <View className="mx-5 mt-5 overflow-hidden rounded-xl3 border border-line">
          <MapView
            style={{ height: 150 }}
            initialRegion={{
              latitude: p.location.lat,
              longitude: p.location.lng,
              latitudeDelta: 0.16,
              longitudeDelta: 0.16,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
            pitchEnabled={false}
            rotateEnabled={false}
          >
            <Circle
              center={p.location}
              radius={p.coverageKm * 1000}
              fillColor="rgba(14,124,123,0.10)"
              strokeColor="rgba(14,124,123,0.4)"
            />
            <Marker coordinate={p.location} />
          </MapView>
          <View className="flex-row items-center gap-2 bg-card px-4 py-2.5">
            <Ionicons name="navigate-outline" size={13} color="#0E7C7B" />
            <Text className="text-[12px] font-semibold text-soft">
              {t("provider.coverage", { km: p.coverageKm, city: p.city })}
              {p.distanceKm != null ? ` · ${t("provider.away", { km: p.distanceKm })}` : ""}
            </Text>
          </View>
        </View>

        {/* about */}
        <View className="mt-5 px-5">
          <Text className="mb-1.5 text-[12px] font-bold uppercase tracking-widest text-faint">
            {t("provider.about")}
          </Text>
          <Text className="text-[14px] leading-relaxed text-ink">{p.bio}</Text>
          <View className="mt-2.5 flex-row flex-wrap gap-1.5">
            {p.qualifications.map((q) => (
              <Chip key={q} tone="neutral" icon="school-outline" label={q} />
            ))}
          </View>
        </View>

        {/* services offered */}
        <View className="mt-5 px-5">
          <Text className="mb-2.5 text-[12px] font-bold uppercase tracking-widest text-faint">
            {t("provider.offered")}
          </Text>
          {p.services.map((s) => {
            const active = selected?.id === s.id;
            return (
              <TouchableOpacity
                key={s.id}
                onPress={() => setSelectedServiceId(s.id)}
                className={cx(
                  "mb-2 flex-row items-center justify-between rounded-2xl border p-4",
                  active ? "border-brand bg-brand-soft" : "border-line bg-card",
                )}
              >
                <View>
                  <Text className={cx("text-[14px] font-bold", active ? "text-brand-dark" : "text-ink")}>
                    {s.name}
                  </Text>
                  <Text className="text-[11.5px] text-soft">{durationLabel(s.durationMin)}</Text>
                </View>
                <Text className={cx("text-[16px] font-bold", active ? "text-brand-dark" : "text-ink")}>
                  {inr(s.basePriceInr)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* reviews */}
        <View className="mt-5 px-5">
          <Text className="mb-1 text-[12px] font-bold uppercase tracking-widest text-faint">
            {t("provider.reviewsTitle")}
          </Text>
          <Card>
            {p.reviews.map((r) => (
              <ReviewRow key={r.id} authorName={r.authorName} rating={r.rating} text={r.text} />
            ))}
            {p.reviews.length === 0 && (
              <Text className="text-[13px] text-soft">No reviews yet.</Text>
            )}
          </Card>
        </View>
      </ScrollView>

      {/* sticky book bar */}
      {selected && (
        <View className="absolute inset-x-0 bottom-0 border-t border-line bg-card/95 px-5 pb-8 pt-3">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-[11px] font-semibold uppercase tracking-widest text-faint">
                {selected.name}
              </Text>
              <Text className="text-[20px] font-bold text-ink">
                {inr(selected.basePriceInr)}
                <Text className="text-[12px] font-medium text-soft"> {t("common.perVisit")}</Text>
              </Text>
            </View>
            <Button title={t("common.bookNow")} icon="calendar" onPress={startBooking} testID="book-now" />
          </View>
        </View>
      )}
    </View>
  );
}
