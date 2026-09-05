import React, { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { WebView, type WebViewNavigation } from "react-native-webview";
import * as Notifications from "expo-notifications";
import { absoluteUrl, api } from "../api/client";
import { useBooking, usePaymentMethods } from "../api/hooks";
import { useBookingDraft, draftToStartsAt } from "../store/bookingDraft";
import {
  bookingDetailsSchema,
  type BookingDetailsForm,
} from "../utils/schemas";
import { dayLabel, durationLabel, inr, timeOf } from "../utils/format";
import {
  Button,
  Card,
  Chip,
  ErrorState,
  Field,
  Header,
  LoadingState,
  Screen,
  cx,
} from "../components/ui";
import { BookingStepper, DayPicker, SlotPicker } from "../components/booking";
import { useQueryClient } from "@tanstack/react-query";

const GENDERS = [
  { value: "F" as const, label: "Female" },
  { value: "M" as const, label: "Male" },
  { value: "O" as const, label: "Other" },
];

export function Booking() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ providerId?: string; serviceId?: string }>();
  const draft = useBookingDraft();
  const [busy, setBusy] = useState(false);

  // Entry params win over a stale persisted draft (e.g. Book Again pre-fill).
  useEffect(() => {
    if (params.providerId && Number(params.providerId) !== draft.providerId) {
      draft.update({ providerId: Number(params.providerId), step: 0 });
    }
    if (params.serviceId && Number(params.serviceId) !== draft.serviceId) {
      draft.update({ serviceId: Number(params.serviceId), step: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.providerId, params.serviceId]);

  const days = Array.from({ length: 14 }, (_, i) => new Date(Date.now() + (i + 1) * 86_400_000));
  const form = useForm<BookingDetailsForm>({
    resolver: zodResolver(bookingDetailsSchema),
    defaultValues: {
      patientName: draft.patientName,
      age: draft.age,
      gender: draft.gender,
      address: draft.address,
      city: draft.city,
      instructions: draft.instructions,
    },
  });

  const createAndPay = async () => {
    const startsAt = draftToStartsAt(draft);
    if (!startsAt || !draft.providerId || !draft.serviceId) return;
    setBusy(true);
    try {
      const amountInr = draft.priceInr;
      const res = await api.createBooking({
        providerId: draft.providerId,
        serviceId: draft.serviceId,
        startsAt,
        patientName: form.getValues("patientName"),
        patientAge: Number(form.getValues("age")),
        patientGender: form.getValues("gender"),
        address: form.getValues("address"),
        city: form.getValues("city"),
        instructions: form.getValues("instructions"),
      });
      const bookingId = res.booking.id;
      draft.reset();
      router.replace({ pathname: "/payment", params: { bookingId, amountInr } });
    } catch (e) {
      Alert.alert("Couldn't create booking", e instanceof Error ? e.message : "Try again");
    } finally {
      setBusy(false);
    }
  };

  const step0Valid = !!draft.dateISO && !!draft.slot;

  return (
    <Screen>
      <Header title={draft.serviceName || "Book visit"} subtitle={draft.providerName} onBack={() => router.back()} />
      <BookingStepper step={draft.step} t={t} />

      {draft.step === 0 && (
        <View>
          <Text className="mb-2.5 text-[12px] font-bold uppercase tracking-widest text-faint">
            {t("booking.selectDate")}
          </Text>
          <DayPicker days={days} value={draft.dateISO} onChange={(iso) => draft.update({ dateISO: iso })} />
          <Text className="mb-2.5 mt-5 text-[12px] font-bold uppercase tracking-widest text-faint">
            {t("booking.selectTime")}
          </Text>
          <SlotPicker value={draft.slot} onChange={(slot) => draft.update({ slot })} />
          <View className="mt-7">
            <Button
              title={t("common.continue")}
              disabled={!step0Valid}
              onPress={() => draft.update({ step: 1 })}
              testID="booking-step-continue"
            />
          </View>
        </View>
      )}

      {draft.step === 1 && (
        <View>
          <Controller control={form.control} name="patientName" render={({ field: { value, onChange } }) => (
            <Field label={t("booking.patientName")} icon="person-outline" value={value}
              onChangeText={(v) => { onChange(v); draft.update({ patientName: v }); }}
              error={form.formState.errors.patientName?.message} testID="booking-patient-name" />
          )} />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Controller control={form.control} name="age" render={({ field: { value, onChange } }) => (
                <Field label={t("booking.age")} icon="hourglass-outline" value={value} keyboardType="number-pad"
                  onChangeText={(v) => { onChange(v.replace(/\D/g, "").slice(0, 3)); draft.update({ age: v }); }}
                  error={form.formState.errors.age?.message} />
              )} />
            </View>
            <View className="flex-[1.6]">
              <Controller control={form.control} name="gender" render={({ field: { value, onChange } }) => (
                <View className="mb-4">
                  <Text className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-faint">{t("booking.gender")}</Text>
                  <View className="flex-row gap-2">
                    {GENDERS.map((g) => (
                      <TouchableOpacity key={g.value} onPress={() => { onChange(g.value); draft.update({ gender: g.value }); }}
                        className={cx("flex-1 items-center rounded-2xl border py-3", value === g.value ? "border-brand bg-brand-soft" : "border-line bg-card")}>
                        <Text className={cx("text-[12.5px] font-bold", value === g.value ? "text-brand-dark" : "text-soft")}>{g.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )} />
            </View>
          </View>
          <Controller control={form.control} name="address" render={({ field: { value, onChange } }) => (
            <Field label={t("booking.visitAddress")} icon="home-outline" value={value} multiline
              onChangeText={(v) => { onChange(v); draft.update({ address: v }); }}
              error={form.formState.errors.address?.message} />
          )} />
          <Controller control={form.control} name="city" render={({ field: { value, onChange } }) => (
            <Field label={t("booking.visitCity")} icon="business-outline" value={value}
              onChangeText={(v) => { onChange(v); draft.update({ city: v }); }}
              error={form.formState.errors.city?.message} />
          )} />
          <Controller control={form.control} name="instructions" render={({ field: { value, onChange } }) => (
            <Field label={t("booking.instructions")} icon="create-outline" value={value} multiline
              placeholder={t("booking.instructionsHint")} placeholderTextColor="#9AA5A2"
              onChangeText={(v) => { onChange(v); draft.update({ instructions: v }); }}
              error={form.formState.errors.instructions?.message} />
          )} />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button title={t("common.back")} variant="ghost" onPress={() => draft.update({ step: 0 })} />
            </View>
            <View className="flex-1">
              <Button
                title={t("common.continue")}
                onPress={form.handleSubmit(() => draft.update({ step: 2 }))}
              />
            </View>
          </View>
        </View>
      )}

      {draft.step === 2 && (
        <View>
          <Text className="mb-3 text-[12px] font-bold uppercase tracking-widest text-faint">
            {t("booking.review")}
          </Text>
          <Card>
            <View className="gap-3">
              <ReviewRow label={t("booking.service")} value={`${draft.serviceName} · ${durationLabel(draft.serviceDurationMin)}`} />
              <ReviewRow label={t("booking.provider")} value={draft.providerName} />
              <ReviewRow
                label={t("booking.when")}
                value={draft.dateISO && draft.slot ? `${dayLabel(draft.dateISO)} · ${draft.slot}` : "—"}
              />
              <ReviewRow label={t("booking.forWhom")} value={`${form.getValues("patientName")} (${form.getValues("age")})`} />
              <ReviewRow label={t("booking.visitAddress")} value={`${form.getValues("address")}, ${form.getValues("city")}`} />
            </View>
            <View className="mt-4 flex-row items-center justify-between border-t border-line pt-4">
              <Text className="text-[13px] font-bold text-soft">{t("booking.total")}</Text>
              <Text className="text-[22px] font-bold text-ink">{inr(draft.priceInr)}</Text>
            </View>
          </Card>
          <View className="mt-5 flex-row gap-3">
            <View className="flex-1">
              <Button title={t("common.back")} variant="ghost" onPress={() => draft.update({ step: 1 })} />
            </View>
            <View className="flex-[1.5]">
              <Button
                title={busy ? t("booking.creating") : t("booking.proceedToPay")}
                loading={busy}
                onPress={createAndPay}
                testID="proceed-to-pay"
              />
            </View>
          </View>
        </View>
      )}
    </Screen>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-start justify-between gap-4">
      <Text className="text-[12px] font-semibold text-faint">{label}</Text>
      <Text className="flex-1 text-right text-[13.5px] font-semibold text-ink" numberOfLines={3}>
        {value}
      </Text>
    </View>
  );
}

export function Payment() {
  const { t } = useTranslation();
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string; amountInr?: string }>();
  const methods = usePaymentMethods();
  const [methodId, setMethodId] = useState<number | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const qc = useQueryClient();

  const booking = useBooking(bookingId ?? "", 0);

  const beginPayment = async () => {
    setBusy(true);
    try {
      const intent = await api.createPaymentIntent(Number(bookingId), methodId);
      setCheckoutUrl(absoluteUrl(intent.checkoutUrl));
    } catch (e) {
      Alert.alert("Couldn't start payment", e instanceof Error ? e.message : "Try again");
    } finally {
      setBusy(false);
    }
  };

  const intercept = (nav: WebViewNavigation): boolean => {
    // The sandbox gateway redirects to carezoa://payment/<result>?bookingId=…
    if (nav.url.startsWith("carezoa://")) {
      const ok = nav.url.includes("/payment/success");
      setCheckoutUrl(null);
      qc.invalidateQueries();
      if (ok) {
        router.replace({ pathname: "/payment-success", params: { bookingId: bookingId! } });
      } else {
        setFailed(true);
      }
      return false;
    }
    return true;
  };

  if (checkoutUrl) {
    return (
      <View className="flex-1 bg-ink">
        <WebView
          source={{ uri: checkoutUrl }}
          onShouldStartLoadWithRequest={intercept}
          startInLoadingState
          javaScriptEnabled
        />
        <TouchableOpacity
          onPress={() => setCheckoutUrl(null)}
          className="absolute right-4 top-14 rounded-full bg-white/15 px-4 py-2"
        >
          <Text className="text-[12px] font-bold text-white">{t("common.back")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Screen>
      <Header title={t("payment.title")} subtitle={booking.data?.service?.name} onBack={() => router.back()} />
      {failed && (
        <View className="mb-4 rounded-2xl bg-danger/10 p-4">
          <Text className="text-[14px] font-bold text-danger">{t("payment.failTitle")}</Text>
          <Text className="mt-0.5 text-[12.5px] text-danger/80">{t("payment.failBody")}</Text>
        </View>
      )}

      <Text className="mb-3 text-[12px] font-bold uppercase tracking-widest text-faint">
        {t("payment.chooseMethod")}
      </Text>
      {methods.isLoading && <LoadingState />}
      {methods.data?.items.map((m) => {
        const active = methodId === m.id;
        return (
          <TouchableOpacity
            key={m.id}
            onPress={() => setMethodId(m.id)}
            className={cx(
              "mb-2 flex-row items-center gap-3 rounded-2xl border p-4",
              active ? "border-brand bg-brand-soft" : "border-line bg-card",
            )}
          >
            <View className={cx("h-10 w-10 items-center justify-center rounded-xl", active ? "bg-brand" : "bg-ink/5")}>
              <Ionicons name={m.type === "upi" ? "flash" : "card"} size={17} color={active ? "#fff" : "#5F6B68"} />
            </View>
            <View className="flex-1">
              <Text className="text-[14px] font-bold text-ink">{m.label}</Text>
              <Text className="text-[12px] text-soft">{m.detail}</Text>
            </View>
            {active && <Ionicons name="checkmark-circle" size={19} color="#0E7C7B" />}
          </TouchableOpacity>
        );
      })}

      <Card className="mt-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-[13px] font-bold text-soft">{t("booking.total")}</Text>
          <Text className="text-[24px] font-bold text-ink">
            {booking.data ? inr(booking.data.amountInr) : "—"}
          </Text>
        </View>
        <Text className="mt-1 text-[11.5px] text-faint">
          Sandbox gateway — no real money moves. Opens a secure in-app page.
        </Text>
      </Card>

      <View className="mt-5">
        <Button
          title={busy ? t("payment.processing") : t("payment.payNow", { amount: booking.data ? inr(booking.data.amountInr) : "" })}
          loading={busy}
          disabled={!methodId || !booking.data}
          onPress={beginPayment}
          testID="pay-now"
        />
      </View>
    </Screen>
  );
}

export function PaymentSuccess() {
  const { t } = useTranslation();
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const booking = useBooking(bookingId ?? "", 0);

  useEffect(() => {
    // Local confirmation notification (push-ready channel in production)
    Notifications.scheduleNotificationAsync({
      content: {
        title: t("payment.successTitle"),
        body: booking.data
          ? `${booking.data.service?.name} · ${booking.data.provider?.name} — ${dayLabel(booking.data.startsAt)}, ${timeOf(booking.data.startsAt)}`
          : t("payment.successBody"),
      },
      trigger: null,
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking.data]);

  return (
    <View className="flex-1 items-center justify-center bg-paper px-8">
      <View className="h-24 w-24 items-center justify-center rounded-full bg-brand-soft">
        <Ionicons name="checkmark" size={48} color="#0E7C7B" />
      </View>
      <Text className="mt-6 text-[26px] font-bold tracking-tight text-ink">
        {t("payment.successTitle")}
      </Text>
      <Text className="mt-2 max-w-[280px] text-center text-[14px] leading-relaxed text-soft">
        {t("payment.successBody")}
      </Text>
      {booking.data && (
        <Card className="mt-6 w-full">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-[15px] font-bold text-ink">{booking.data.service?.name}</Text>
              <Text className="mt-0.5 text-[12.5px] text-soft">{booking.data.provider?.name}</Text>
            </View>
            <Chip tone="brand" icon="time" label={`${dayLabel(booking.data.startsAt)} ${timeOf(booking.data.startsAt)}`} />
          </View>
        </Card>
      )}
      <View className="mt-8 w-full gap-3">
        <Button title={t("payment.viewVisits")} onPress={() => router.replace("/(tabs)/visits")} testID="success-view-visits" />
        <Button title={t("payment.backHome")} variant="ghost" onPress={() => router.replace("/(tabs)/home")} />
      </View>
    </View>
  );
}
