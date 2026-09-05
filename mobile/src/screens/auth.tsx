import React, { useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../api/client";
import { useAuth } from "../store/auth";
import {
  otpSchema,
  phoneSchema,
  profileSetupSchema,
  type OtpForm,
  type PhoneForm,
  type ProfileSetupForm,
} from "../utils/schemas";
import { Button, Field, cx } from "../components/ui";

const SLIDES = [
  { icon: "shield-checkmark" as const, title: "auth.slide1Title", body: "auth.slide1Body" },
  { icon: "home" as const, title: "auth.slide2Title", body: "auth.slide2Body" },
  { icon: "chatbubbles" as const, title: "auth.slide3Title", body: "auth.slide3Body" },
];

export function OnboardingCarousel() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const ref = useRef<FlatList>(null);
  const last = page === SLIDES.length - 1;

  return (
    <View className="flex-1 bg-paper" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="flex-row justify-end px-6 pt-4">
        <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
          <Text className="text-[14px] font-semibold text-faint">Skip</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        ref={ref}
        data={SLIDES}
        keyExtractor={(s) => s.title}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={{ width }} className="items-center justify-center px-10">
            <View className="h-24 w-24 items-center justify-center rounded-xl3 bg-brand-soft">
              <Ionicons name={item.icon} size={42} color="#0E7C7B" />
            </View>
            <Text className="mt-8 text-center text-[26px] font-bold leading-tight text-ink">
              {t(item.title)}
            </Text>
            <Text className="mt-3 text-center text-[14.5px] leading-relaxed text-soft">
              {t(item.body)}
            </Text>
          </View>
        )}
      />
      <View className="items-center px-6 pb-6">
        <View className="mb-6 flex-row gap-2">
          {SLIDES.map((_, i) => (
            <View
              key={i}
              className={cx("h-2 rounded-full", i === page ? "w-6 bg-brand" : "w-2 bg-ink/15")}
            />
          ))}
        </View>
        <View className="w-full">
          <Button
            testID="onboarding-continue"
            title={last ? t("auth.getStarted") : t("common.continue")}
            onPress={() =>
              last
                ? router.replace("/(auth)/login")
                : ref.current?.scrollToIndex({ index: page + 1, animated: true })
            }
          />
        </View>
      </View>
    </View>
  );
}

export function PhoneOTPLogin() {
  const { t } = useTranslation();
  const router = useRouter();
  const setSession = useAuth((s) => s.setSession);
  const [stage, setStage] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState("");

  const phoneForm = useForm<PhoneForm>({ resolver: zodResolver(phoneSchema), defaultValues: { phone: "+91" } });
  const otpForm = useForm<OtpForm>({ resolver: zodResolver(otpSchema), defaultValues: { code: "" } });

  const sendOtp = phoneForm.handleSubmit(async (v) => {
    setBusy(true);
    setServerError("");
    try {
      await api.otpRequest(v.phone.replace(/[\s-]/g, ""));
      setPhone(v.phone);
      setStage("otp");
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  });

  const verify = otpForm.handleSubmit(async (v) => {
    setBusy(true);
    setServerError("");
    try {
      const res = await api.otpVerify(phone.replace(/[\s-]/g, ""), v.code);
      await setSession(res.access_token, null as any);
      router.replace(res.is_new_user ? "/(auth)/profile-setup" : "/(tabs)/home");
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setBusy(false);
    }
  });

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-paper"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerClassName="flex-1 px-6 pt-16">
        <View className="h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft">
          <Ionicons name={stage === "phone" ? "call" : "lock-closed"} size={24} color="#0E7C7B" />
        </View>
        <Text className="mt-5 text-[26px] font-bold tracking-tight text-ink">
          {stage === "phone" ? t("auth.phoneTitle") : t("auth.otpTitle")}
        </Text>
        <Text className="mt-1.5 text-[13.5px] text-soft">
          {stage === "phone" ? t("auth.phoneBody") : t("auth.otpBody", { phone })}
        </Text>

        <View className="mt-8">
          {stage === "phone" ? (
            <Controller
              control={phoneForm.control}
              name="phone"
              render={({ field: { value, onChange } }) => (
                <Field
                  label={t("auth.phoneLabel")}
                  icon="call-outline"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="phone-pad"
                  placeholder="+91 98765 43210"
                  error={phoneForm.formState.errors.phone?.message}
                  testID="phone-input"
                />
              )}
            />
          ) : (
            <Controller
              control={otpForm.control}
              name="code"
              render={({ field: { value, onChange } }) => (
                <Field
                  label="OTP"
                  icon="keypad-outline"
                  value={value}
                  onChangeText={(txt) => onChange(txt.replace(/\D/g, "").slice(0, 6))}
                  keyboardType="number-pad"
                  placeholder="123456"
                  error={otpForm.formState.errors.code?.message}
                  testID="otp-input"
                />
              )}
            />
          )}
          <Text className="-mt-2 mb-3 text-[11.5px] text-faint">{t("auth.devCodeHint")}</Text>
          {!!serverError && <Text className="mb-3 text-[13px] font-semibold text-danger">{serverError}</Text>}

          <Button
            testID={stage === "phone" ? "send-otp" : "verify-otp"}
            title={stage === "phone" ? t("auth.sendOtp") : t("auth.verify")}
            loading={busy}
            onPress={stage === "phone" ? sendOtp : verify}
          />
          {stage === "otp" && (
            <TouchableOpacity onPress={() => setStage("phone")} className="mt-4 items-center">
              <Text className="text-[13px] font-semibold text-brand">{t("auth.resend")}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const GENDERS = [
  { value: "F" as const, label: "Female" },
  { value: "M" as const, label: "Male" },
  { value: "O" as const, label: "Other" },
];

export function ProfileSetup() {
  const { t } = useTranslation();
  const router = useRouter();
  const setPatient = useAuth((s) => s.setPatient);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState("");

  const form = useForm<ProfileSetupForm>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: { name: "", dob: "", gender: "F", city: "", address: "" },
  });

  const save = form.handleSubmit(async (v) => {
    setBusy(true);
    try {
      const patient = await api.patchProfile(v);
      setPatient(patient);
      router.replace("/(tabs)/home");
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  });

  return (
    <ScrollView className="flex-1 bg-paper" contentContainerClassName="px-6 pb-10 pt-16">
      <Text className="text-[26px] font-bold tracking-tight text-ink">{t("auth.setupTitle")}</Text>
      <View className="mt-6">
        <Controller control={form.control} name="name" render={({ field: { value, onChange } }) => (
          <Field label={t("auth.nameLabel")} icon="person-outline" value={value} onChangeText={onChange} error={form.formState.errors.name?.message} testID="setup-name" />
        )} />
        <Controller control={form.control} name="dob" render={({ field: { value, onChange } }) => (
          <Field label={t("auth.dobLabel")} icon="calendar-outline" value={value} onChangeText={onChange} placeholder="14/09/1991" error={form.formState.errors.dob?.message} />
        )} />
        <Controller control={form.control} name="gender" render={({ field: { value, onChange } }) => (
          <View className="mb-4">
            <Text className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-faint">{t("auth.genderLabel")}</Text>
            <View className="flex-row gap-2">
              {GENDERS.map((g) => (
                <TouchableOpacity key={g.value} onPress={() => onChange(g.value)}
                  className={cx("flex-1 items-center rounded-2xl border py-3", value === g.value ? "border-brand bg-brand-soft" : "border-line bg-card")}>
                  <Text className={cx("text-[13px] font-bold", value === g.value ? "text-brand-dark" : "text-soft")}>{g.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )} />
        <Controller control={form.control} name="city" render={({ field: { value, onChange } }) => (
          <Field label={t("auth.cityLabel")} icon="business-outline" value={value} onChangeText={onChange} placeholder="Bhubaneswar" error={form.formState.errors.city?.message} />
        )} />
        <Controller control={form.control} name="address" render={({ field: { value, onChange } }) => (
          <Field label={t("auth.addressLabel")} icon="home-outline" value={value} onChangeText={onChange} multiline error={form.formState.errors.address?.message} />
        )} />
        {!!serverError && <Text className="mb-3 text-[13px] font-semibold text-danger">{serverError}</Text>}
        <Button title={t("auth.finishSetup")} loading={busy} onPress={save} />
      </View>
    </ScrollView>
  );
}
