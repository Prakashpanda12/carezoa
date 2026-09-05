import React, { useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useProviders, useServices } from "../api/hooks";
import {
  EmptyState,
  Header,
  LoadingState,
  Screen,
  cx,
} from "../components/ui";
import { ProviderCard } from "../components/provider";

export function SearchServices() {
  const { t } = useTranslation();
  const router = useRouter();
  const [q, setQ] = useState("");
  const providers = useProviders(q || undefined);
  const services = useServices();

  return (
    <Screen>
      <Header title={t("search.title")} onBack={() => router.back()} />
      <View className="mb-4 flex-row items-center gap-2.5 rounded-full border border-line bg-card px-4 py-3">
        <Ionicons name="search" size={17} color="#9AA5A2" />
        <TextInput
          autoFocus
          value={q}
          onChangeText={setQ}
          placeholder={t("home.searchPlaceholder")}
          placeholderTextColor="#9AA5A2"
          className="flex-1 text-[14px] text-ink"
          testID="search-input"
        />
        {!!q && (
          <TouchableOpacity onPress={() => setQ("")}>
            <Ionicons name="close-circle" size={17} color="#9AA5A2" />
          </TouchableOpacity>
        )}
      </View>

      {!q && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="mb-4 gap-2">
          {services.data?.items.map((s) => (
            <TouchableOpacity
              key={s.id}
              onPress={() =>
                router.push({ pathname: "/providers", params: { serviceId: s.id, serviceName: s.name } })
              }
              className="rounded-full border border-line bg-card px-4 py-2"
            >
              <Text className="text-[12.5px] font-semibold text-soft">{s.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {providers.isLoading && <LoadingState />}
      {providers?.data && providers?.data?.items.length === 0 && (
        <EmptyState icon="search" title="No matches" body="Try a different name, specialty or service." />
      )}
      {providers?.data?.items?.map((p) => (
        <ProviderCard
          key={p.id}
          provider={p}
          onPress={() => router.push(`/provider/${p.id}`)}
        />
      ))}
    </Screen>
  );
}

export function ProviderList() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ serviceId?: string; serviceName?: string }>();
  const providers = useProviders();

  return (
    <Screen>
      <Header
        title={params.serviceName ?? t("search.title")}
        subtitle="Verified, background-checked providers"
        onBack={() => router.back()}
      />
      <View className="mb-4 flex-row items-center gap-2 rounded-2xl bg-brand-soft p-3">
        <Ionicons name="shield-checkmark" size={15} color="#0E7C7B" />
        <Text className="flex-1 text-[12px] font-medium text-brand-dark">
          Every provider is certified and reviewed by CAREZOA families.
        </Text>
      </View>
      {providers.isLoading && <LoadingState />}
      {providers?.data?.items?.map((p) => (
        <ProviderCard
          key={p.id}
          provider={p}
          onPress={() =>
            router.push({
              pathname: `/provider/${p.id}`,
              params: params.serviceId ? { serviceId: params.serviceId } : {},
            })
          }
        />
      ))}
    </Screen>
  );
}
