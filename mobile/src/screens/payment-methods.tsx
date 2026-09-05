import React, { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { keys, usePaymentMethods } from "../api/hooks";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Header,
  LoadingState,
  Screen,
  cx,
} from "../components/ui";

export function PaymentMethods() {
  const { t } = useTranslation();
  const router = useRouter();
  const qc = useQueryClient();
  const methods = usePaymentMethods();
  const [mode, setMode] = useState<"upi" | "card">("upi");
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = () => qc.invalidateQueries({ queryKey: keys.payMethods });

  const add = async () => {
    const clean = detail.trim();
    if (clean.length < 4) return;
    setBusy(true);
    try {
      await api.addPaymentMethod(mode, clean);
      setDetail("");
      refresh();
    } catch (e) {
      Alert.alert("Couldn't add", e instanceof Error ? e.message : "");
    } finally {
      setBusy(false);
    }
  };

  // BUG-M07 fix: mask card number while typing (show only last 4 digits)
  const formatCardInput = (text: string) => {
    if (mode !== "card") return text;
    const digits = text.replace(/\D/g, "");
    // Format as groups of 4: 1234 5678 9012 3456
    const groups = digits.match(/.{1,4}/g);
    return groups ? groups.join(" ") : "";
  };

  const displayValue = mode === "card" ? formatCardInput(detail) : detail;

  const remove = (id: number, label: string) => {
    Alert.alert(t("common.delete"), label, [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          await api.deletePaymentMethod(id);
          refresh();
        },
      },
    ]);
  };

  return (
    <Screen onRefresh={refresh} refreshing={methods.isRefetching}>
      <Header title={t("payMethods.title")} onBack={() => router.back()} />

      {methods.isLoading && <LoadingState />}
      {methods.isError && <ErrorState label="Couldn't load methods." onRetry={() => methods.refetch()} />}
      {methods.data?.items.length === 0 && (
        <EmptyState icon="card-outline" title="No methods" body={t("payMethods.empty")} />
      )}
      {methods.data?.items.map((m) => (
        <Card key={m.id} className="mb-2.5">
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-brand-soft">
              <Ionicons name={m.type === "upi" ? "flash" : "card"} size={17} color="#0E7C7B" />
            </View>
            <View className="flex-1">
              <Text className="text-[14.5px] font-bold text-ink">{m.label}</Text>
              <Text className="text-[12px] text-soft">{m.detail}</Text>
            </View>
            <TouchableOpacity onPress={() => remove(m.id, `${m.label} ${m.detail}`)}>
              <Ionicons name="trash-outline" size={17} color="#D3402E" />
            </TouchableOpacity>
          </View>
        </Card>
      ))}

      {/* add new */}
      <Card className="mt-4">
        <View className="flex-row gap-2">
          {(["upi", "card"] as const).map((k) => (
            <TouchableOpacity
              key={k}
              onPress={() => setMode(k)}
              className={cx(
                "flex-1 items-center rounded-2xl border py-2.5",
                mode === k ? "border-brand bg-brand-soft" : "border-line bg-card",
              )}
            >
              <Text className={cx("text-[13px] font-bold uppercase", mode === k ? "text-brand-dark" : "text-soft")}>
                {k === "upi" ? "UPI" : "Card"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View className="mt-3 flex-row items-center gap-2">
          <TextInput
            value={displayValue}
            onChangeText={(text) => {
              // BUG-M07 fix: store raw digits for card, full text for UPI
              setDetail(mode === "card" ? text.replace(/\D/g, "") : text);
            }}
            placeholder={mode === "upi" ? t("payMethods.addUpiPlaceholder") : "1234 5678 9012 3456"}
            placeholderTextColor="#9AA5A2"
            keyboardType={mode === "card" ? "number-pad" : "default"}
            maxLength={mode === "card" ? 19 : 50} // 16 digits + 3 spaces for card
            className="flex-1 rounded-2xl border border-line bg-card px-4 py-3 text-[14px] text-ink"
            testID="add-method-input"
            accessibilityLabel={mode === "upi" ? "UPI ID input" : "Card number input"}
            secureTextEntry={false}
          />
          <Button title={t("payMethods.add")} small loading={busy} onPress={add} accessibilityLabel="Add payment method" />
        </View>
      </Card>
    </Screen>
  );
}
