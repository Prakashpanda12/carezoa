import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useAuth } from "../store/auth";
import { useBookings, useProviders, useServices } from "../api/hooks";
import { dayLabel, timeOf } from "../utils/format";
import {
  Avatar,
  Card,
  Chip,
  ErrorState,
  LoadingState,
  Screen,
} from "../components/ui";
import { ServiceTile } from "../components/provider";
import { ProviderCard } from "../components/provider";
import { StatusChip } from "../components/visit";

export function Home() {
  const { t } = useTranslation();
  const router = useRouter();
  const patient = useAuth((s) => s.patient);
  const viewer = useAuth((s) => s.viewer);

  const services = useServices();
  const providers = useProviders();
  const upcoming = useBookings("upcoming");

  const firstName = (patient?.name ?? "there").split(" ")[0] ?? "there";
  const nextVisit = upcoming.data?.items?.[0];

  if (services.isLoading) return <LoadingState label={t("common.loading")} />;
  if (services.isError)
    return <ErrorState label="Couldn't reach CAREZOA. Check your connection." onRetry={() => services.refetch()} />;

  return (
    <Screen onRefresh={() => { services.refetch(); providers.refetch(); upcoming.refetch(); }}>
      {/* header */}
      <View className="mb-5 mt-2 flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-[12px] font-semibold uppercase tracking-widest text-faint">
            {patient?.city ?? "Home care"}
          </Text>
          <Text className="text-[26px] font-bold tracking-tight text-ink">
            {t("home.greeting", { name: firstName })}
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/(tabs)/account")}>
          <Avatar name={patient?.name ?? "C Z"} size={46} />
        </TouchableOpacity>
      </View>

      {viewer && (
        <View className="mb-4 flex-row items-center gap-2 rounded-2xl bg-brand-soft p-3">
          <Ionicons name="people" size={15} color="#0E7C7B" />
          <Text className="flex-1 text-[12.5px] font-semibold text-brand-dark">
            {t("home.viewingAs", { name: viewer.name })}
          </Text>
        </View>
      )}

      {/* search */}
      <TouchableOpacity
        onPress={() => router.push("/search")}
        className="mb-6 flex-row items-center gap-2.5 rounded-full border border-line bg-card px-4 py-3.5"
        activeOpacity={0.85}
      >
        <Ionicons name="search" size={17} color="#9AA5A2" />
        <Text className="text-[14px] text-faint">{t("home.searchPlaceholder")}</Text>
      </TouchableOpacity>

      {/* services */}
      <Text className="mb-3 text-[12px] font-bold uppercase tracking-widest text-faint">
        {t("home.services")}
      </Text>
      <View className="mb-6 flex-row flex-wrap gap-2.5">
        {services.data.items.slice(0, 6).map((s) => (
          <View key={s.id} style={{ width: "31.5%" }}>
            <ServiceTile
              service={s}
              onPress={() =>
                router.push({ pathname: "/providers", params: { serviceId: s.id, serviceName: s.name } })
              }
            />
          </View>
        ))}
      </View>

      {/* upcoming visit */}
      <Text className="mb-3 text-[12px] font-bold uppercase tracking-widest text-faint">
        {t("home.upcoming")}
      </Text>
      {nextVisit ? (
        <TouchableOpacity onPress={() => router.push(`/visit/${nextVisit.id}`)} activeOpacity={0.9}>
          <View className="mb-6 rounded-xl3 bg-ink p-5">
            <View className="flex-row items-center justify-between">
              <Text className="text-[16px] font-bold text-paper" numberOfLines={1}>
                {nextVisit.service?.name}
              </Text>
              <StatusChip status={nextVisit.status} t={t} />
            </View>
            <Text className="mt-1 text-[13px] text-paper/60">
              {nextVisit.provider?.name} · for {nextVisit.patient.name}
            </Text>
            <View className="mt-3 flex-row items-center gap-1.5">
              <Ionicons name="time" size={13} color="#E0F0EF" />
              <Text className="text-[13px] font-bold text-paper">
                {dayLabel(nextVisit.startsAt)} · {timeOf(nextVisit.startsAt)}
              </Text>
            </View>
            {nextVisit.status === "en_route" && (
              <View className="mt-3 flex-row items-center gap-2">
                <Chip tone="dark" icon="car" label={t("visit.en_route")} />
              </View>
            )}
          </View>
        </TouchableOpacity>
      ) : (
        <Card className="mb-6">
          <Text className="text-[13px] text-soft">{t("home.noUpcoming")}</Text>
          <View className="mt-3">
            <Chip tone="brand" icon="add" label={t("common.bookNow")} />
          </View>
        </Card>
      )}

      {/* providers near you */}
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-[12px] font-bold uppercase tracking-widest text-faint">
          {t("home.providersNear")}
        </Text>
        <TouchableOpacity onPress={() => router.push("/search")}>
          <Text className="text-[12px] font-bold text-brand">{t("common.seeAll")}</Text>
        </TouchableOpacity>
      </View>
      {providers?.data?.items?.slice(0, 3)?.map((p) => (
        <ProviderCard key={p.id} provider={p} onPress={() => router.push(`/provider/${p.id}`)} />
      ))}

      {/* plans teaser */}
      <TouchableOpacity onPress={() => router.push("/packages")} activeOpacity={0.9}>
        <View className="mt-2 flex-row items-center gap-3 rounded-xl3 bg-brand-soft p-4">
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-brand">
            <Ionicons name="repeat" size={19} color="#fff" />
          </View>
          <View className="flex-1">
            <Text className="text-[14px] font-bold text-brand-dark">{t("home.plans")}</Text>
            <Text className="text-[12px] text-brand-dark/70">Save up to 20% with monthly plans</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#0E7C7B" />
        </View>
      </TouchableOpacity>
    </Screen>
  );
}
