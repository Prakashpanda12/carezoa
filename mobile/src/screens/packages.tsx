import React from "react";
import { Alert, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { keys, usePackages } from "../api/hooks";
import { inr } from "../utils/format";
import {
  Button,
  Card,
  Chip,
  ErrorState,
  Header,
  LoadingState,
  Screen,
  cx,
} from "../components/ui";
import type { CarePackage } from "../types/api";

function PlanCard({ plan, onOpen, onSubscribe, busy }: { plan: CarePackage; onOpen: () => void; onSubscribe: () => void; busy: boolean }) {
  const { t } = useTranslation();
  return (
    <Card className={cx("mb-3", plan.subscribed && "border-brand")}>
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-[17px] font-bold text-ink">{plan.name}</Text>
          <Text className="mt-0.5 text-[12.5px] text-soft" numberOfLines={2}>{plan.description}</Text>
        </View>
        {plan.subscribed && <Chip tone="success" icon="checkmark-circle" label={t("packages.subscribed")} />}
      </View>
      <View className="mt-2 flex-row items-center gap-2">
        <Chip tone="brand" icon="calendar-outline" label={t("packages.visits", { count: plan.visitsPerMonth })} />
        <Text className="text-[19px] font-bold text-ink">
          {inr(plan.pricePerMonthInr)}
          <Text className="text-[12px] font-medium text-soft">{t("packages.perMonth")}</Text>
        </Text>
      </View>
      <View className="mt-3 flex-row gap-2 border-t border-line pt-3">
        <View className="flex-1">
          <Button title={plan.subscribed ? "Open" : "Details"} small variant="ghost" onPress={onOpen} />
        </View>
        {!plan.subscribed && (
          <View className="flex-1">
            <Button title={t("packages.subscribe")} small loading={busy} onPress={onSubscribe} testID={`subscribe-${plan.id}`} />
          </View>
        )}
      </View>
    </Card>
  );
}

export function Packages() {
  const router = useRouter();
  const qc = useQueryClient();
  const plans = usePackages();
  const [busyId, setBusyId] = React.useState<number | null>(null);

  const subscribe = async (id: number) => {
    setBusyId(id);
    try {
      await api.subscribePackage(id);
      qc.invalidateQueries({ queryKey: keys.packages });
    } catch (e) {
      Alert.alert("Couldn't subscribe", e instanceof Error ? e.message : "");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Screen onRefresh={() => plans.refetch()} refreshing={plans.isRefetching}>
      <Header title="Care plans" subtitle="Recurring visits, one predictable price" onBack={() => router.back()} />
      {plans.isLoading && <LoadingState />}
      {plans.isError && <ErrorState label="Couldn't load plans." onRetry={() => plans.refetch()} />}
      {plans.data?.items.map((p) => (
        <PlanCard
          key={p.id}
          plan={p}
          busy={busyId === p.id}
          onOpen={() => router.push(`/package/${p.id}`)}
          onSubscribe={() => subscribe(p.id)}
        />
      ))}
    </Screen>
  );
}

export function CarePlanDetail() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();
  const plans = usePackages();
  const [busy, setBusy] = React.useState(false);

  const plan = plans.data?.items.find((p) => p.id === Number(id));

  const subscribe = async () => {
    if (!plan) return;
    setBusy(true);
    try {
      await api.subscribePackage(plan.id);
      await qc.invalidateQueries({ queryKey: keys.packages });
    } catch (e) {
      Alert.alert("Couldn't subscribe", e instanceof Error ? e.message : "");
    } finally {
      setBusy(false);
    }
  };

  if (plans.isLoading) return <LoadingState />;
  if (!plan) return <ErrorState label="Plan not found." onRetry={() => plans.refetch()} />;

  return (
    <Screen>
      <Header title={plan.name} subtitle={plan.description} onBack={() => router.back()} />
      <Card>
        <View className="flex-row items-end justify-between">
          <Text className="text-[32px] font-bold tracking-tight text-ink">
            {inr(plan.pricePerMonthInr)}
            <Text className="text-[14px] font-medium text-soft">{t("packages.perMonth")}</Text>
          </Text>
          <Chip tone="brand" icon="calendar-outline" label={t("packages.visits", { count: plan.visitsPerMonth })} />
        </View>
        <View className="mt-4 border-t border-line pt-4">
          <Text className="mb-2 text-[12px] font-bold uppercase tracking-widest text-faint">
            {t("packages.includes")}
          </Text>
          {plan.includes.map((inc) => (
            <View key={inc} className="flex-row items-center gap-2.5 py-1.5">
              <Ionicons name="checkmark-circle" size={16} color="#0E7C7B" />
              <Text className="flex-1 text-[14px] text-ink">{inc}</Text>
            </View>
          ))}
        </View>
        <View className="mt-4 rounded-2xl bg-brand-soft p-3.5">
          <Text className="text-[11px] font-bold uppercase tracking-widest text-brand-dark/60">
            {t("packages.bestFor")}
          </Text>
          <Text className="mt-1 text-[13.5px] font-semibold text-brand-dark">{plan.bestFor}</Text>
        </View>
      </Card>
      <View className="mt-5">
        {plan.subscribed ? (
          <Button title={t("packages.subscribed")} icon="checkmark-circle" onPress={() => router.back()} />
        ) : (
          <Button title={`${t("packages.subscribe")} · ${inr(plan.pricePerMonthInr)}${t("packages.perMonth")}`} loading={busy} onPress={subscribe} />
        )}
      </View>
    </Screen>
  );
}
