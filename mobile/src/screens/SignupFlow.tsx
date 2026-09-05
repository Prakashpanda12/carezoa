import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../../api/client";
import { useAuth } from "../../store/auth";
import {
  phoneSchema,
  otpSchema,
  profileSetupSchema,
  type PhoneForm,
  type OtpForm,
  type ProfileSetupForm,
} from "../../utils/schemas";
import { Button, Field, Card, cx } from "../../components/ui";

type SignupStep = "welcome" | "phone" | "otp" | "profile" | "terms" | "success";

export function SignupFlow() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setSession = useAuth((s) => s.setSession);
  const setPatient = useAuth((s) => s.setPatient);

  const [step, setStep] = useState<SignupStep>("welcome");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState("");

  const phoneForm = useForm<PhoneForm>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "+91" },
  });

  const otpForm = useForm<OtpForm>({
    resolver: zodResolver(otpSchema),
    defaultValues: { code: "" },
  });

  const profileForm = useForm<ProfileSetupForm>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: { name: "", dob: "", gender: "F", city: "", address: "" },
  });

  const [termsAccepted, setTermsAccepted] = useState(false);

  const sendOtp = phoneForm.handleSubmit(async (v) => {
    setBusy(true);
    setServerError("");
    try {
      await api.otpRequest(v.phone.replace(/[\s-]/g, ""));
      setPhone(v.phone);
      setStep("otp");
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Failed to send OTP");
    } finally {
      setBusy(false);
    }
  });

  const verifyOtp = otpForm.handleSubmit(async (v) => {
    setBusy(true);
    setServerError("");
    try {
      const res = await api.otpVerify(phone.replace(/[\s-]/g, ""), v.code);
      await setSession(res.access_token, null as any);
      setStep("profile");
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setBusy(false);
    }
  });

  const saveProfile = profileForm.handleSubmit(async (v) => {
    setBusy(true);
    setServerError("");
    try {
      const patient = await api.patchProfile(v);
      setPatient(patient);
      setStep("terms");
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Failed to save profile");
    } finally {
      setBusy(false);
    }
  });

  const completeSignup = () => {
    if (!termsAccepted) {
      setServerError("Please accept the terms and conditions");
      return;
    }
    setStep("success");
  };

  const finishSignup = () => {
    router.replace("/(tabs)/home");
  };

  const goBack = () => {
    const steps: SignupStep[] = ["welcome", "phone", "otp", "profile", "terms", "success"];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
      setServerError("");
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-paper"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      {/* Header with back button */}
      {step !== "welcome" && step !== "success" && (
        <View className="flex-row items-center px-4 py-3">
          <TouchableOpacity onPress={goBack} className="p-2">
            <Ionicons name="arrow-back" size={24} color="#0E7C7B" />
          </TouchableOpacity>
          <Text className="ml-3 text-[16px] font-semibold text-ink">
            {t("signup.createAccount")}
          </Text>
        </View>
      )}

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pb-10"
        keyboardShouldPersistTaps="handled"
      >
        {/* Welcome Step */}
        {step === "welcome" && (
          <View className="flex-1 items-center justify-center pt-20">
            <View className="h-28 w-28 items-center justify-center rounded-full bg-brand-soft">
              <Ionicons name="heart" size={56} color="#0E7C7B" />
            </View>
            <Text className="mt-8 text-center text-[32px] font-bold tracking-tight text-ink">
              {t("signup.welcomeTitle")}
            </Text>
            <Text className="mt-3 text-center text-[15px] leading-relaxed text-soft">
              {t("signup.welcomeBody")}
            </Text>
            <View className="mt-12 w-full gap-4">
              <Button
                title={t("signup.getStarted")}
                onPress={() => setStep("phone")}
                testID="signup-get-started"
              />
              <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
                <Text className="text-center text-[14px] font-semibold text-brand">
                  {t("signup.alreadyHaveAccount")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Phone Step */}
        {step === "phone" && (
          <View className="pt-8">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft">
              <Ionicons name="call" size={24} color="#0E7C7B" />
            </View>
            <Text className="mt-5 text-[26px] font-bold tracking-tight text-ink">
              {t("signup.phoneTitle")}
            </Text>
            <Text className="mt-1.5 text-[13.5px] text-soft">
              {t("signup.phoneBody")}
            </Text>

            <View className="mt-8">
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
                    testID="signup-phone-input"
                  />
                )}
              />
              <Text className="-mt-2 mb-3 text-[11.5px] text-faint">
                {t("auth.devCodeHint")}
              </Text>
              {!!serverError && (
                <Text className="mb-3 text-[13px] font-semibold text-danger">
                  {serverError}
                </Text>
              )}
              <Button
                title={t("auth.sendOtp")}
                loading={busy}
                onPress={sendOtp}
                testID="signup-send-otp"
              />
            </View>
          </View>
        )}

        {/* OTP Step */}
        {step === "otp" && (
          <View className="pt-8">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft">
              <Ionicons name="lock-closed" size={24} color="#0E7C7B" />
            </View>
            <Text className="mt-5 text-[26px] font-bold tracking-tight text-ink">
              {t("auth.otpTitle")}
            </Text>
            <Text className="mt-1.5 text-[13.5px] text-soft">
              {t("auth.otpBody", { phone })}
            </Text>

            <View className="mt-8">
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
                    testID="signup-otp-input"
                  />
                )}
              />
              {!!serverError && (
                <Text className="mb-3 text-[13px] font-semibold text-danger">
                  {serverError}
                </Text>
              )}
              <Button
                title={t("auth.verify")}
                loading={busy}
                onPress={verifyOtp}
                testID="signup-verify-otp"
              />
              <TouchableOpacity
                onPress={() => {
                  setStep("phone");
                  setServerError("");
                }}
                className="mt-4 items-center"
              >
                <Text className="text-[13px] font-semibold text-brand">
                  {t("auth.resend")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Profile Step */}
        {step === "profile" && (
          <View className="pt-8">
            <Text className="text-[26px] font-bold tracking-tight text-ink">
              {t("auth.setupTitle")}
            </Text>
            <Text className="mt-1.5 text-[13.5px] text-soft">
              {t("signup.profileBody")}
            </Text>

            <View className="mt-6">
              <Controller
                control={profileForm.control}
                name="name"
                render={({ field: { value, onChange } }) => (
                  <Field
                    label={t("auth.nameLabel")}
                    icon="person-outline"
                    value={value}
                    onChangeText={onChange}
                    error={profileForm.formState.errors.name?.message}
                    testID="signup-name"
                  />
                )}
              />
              <Controller
                control={profileForm.control}
                name="dob"
                render={({ field: { value, onChange } }) => (
                  <Field
                    label={t("auth.dobLabel")}
                    icon="calendar-outline"
                    value={value}
                    onChangeText={onChange}
                    placeholder="14/09/1991"
                    error={profileForm.formState.errors.dob?.message}
                  />
                )}
              />
              <Controller
                control={profileForm.control}
                name="gender"
                render={({ field: { value, onChange } }) => (
                  <View className="mb-4">
                    <Text className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-faint">
                      {t("auth.genderLabel")}
                    </Text>
                    <View className="flex-row gap-2">
                      {[
                        { value: "F" as const, label: "Female" },
                        { value: "M" as const, label: "Male" },
                        { value: "O" as const, label: "Other" },
                      ].map((g) => (
                        <TouchableOpacity
                          key={g.value}
                          onPress={() => onChange(g.value)}
                          className={cx(
                            "flex-1 items-center rounded-2xl border py-3",
                            value === g.value ? "border-brand bg-brand-soft" : "border-line bg-card"
                          )}
                        >
                          <Text
                            className={cx(
                              "text-[13px] font-bold",
                              value === g.value ? "text-brand-dark" : "text-soft"
                            )}
                          >
                            {g.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              />
              <Controller
                control={profileForm.control}
                name="city"
                render={({ field: { value, onChange } }) => (
                  <Field
                    label={t("auth.cityLabel")}
                    icon="business-outline"
                    value={value}
                    onChangeText={onChange}
                    placeholder="Bhubaneswar"
                    error={profileForm.formState.errors.city?.message}
                  />
                )}
              />
              <Controller
                control={profileForm.control}
                name="address"
                render={({ field: { value, onChange } }) => (
                  <Field
                    label={t("auth.addressLabel")}
                    icon="home-outline"
                    value={value}
                    onChangeText={onChange}
                    multiline
                    error={profileForm.formState.errors.address?.message}
                  />
                )}
              />
              {!!serverError && (
                <Text className="mb-3 text-[13px] font-semibold text-danger">
                  {serverError}
                </Text>
              )}
              <Button
                title={t("common.continue")}
                loading={busy}
                onPress={saveProfile}
              />
            </View>
          </View>
        )}

        {/* Terms Step */}
        {step === "terms" && (
          <View className="pt-8">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft">
              <Ionicons name="document-text" size={24} color="#0E7C7B" />
            </View>
            <Text className="mt-5 text-[26px] font-bold tracking-tight text-ink">
              {t("signup.termsTitle")}
            </Text>
            <Text className="mt-1.5 text-[13.5px] text-soft">
              {t("signup.termsBody")}
            </Text>

            <Card className="mt-6">
              <ScrollView style={{ maxHeight: 300 }}>
                <Text className="text-[13px] leading-relaxed text-soft">
                  {t("signup.termsContent")}
                </Text>
              </ScrollView>
            </Card>

            <TouchableOpacity
              onPress={() => setTermsAccepted(!termsAccepted)}
              className="mt-6 flex-row items-center"
            >
              <View
                className={cx(
                  "h-6 w-6 items-center justify-center rounded-md border-2",
                  termsAccepted ? "border-brand bg-brand" : "border-line bg-card"
                )}
              >
                {termsAccepted && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
              <Text className="ml-3 flex-1 text-[14px] text-ink">
                {t("signup.acceptTerms")}
              </Text>
            </TouchableOpacity>

            {!!serverError && (
              <Text className="mt-3 text-[13px] font-semibold text-danger">
                {serverError}
              </Text>
            )}

            <Button
              title={t("signup.completeSignup")}
              onPress={completeSignup}
              disabled={!termsAccepted}
              className="mt-6"
            />
          </View>
        )}

        {/* Success Step */}
        {step === "success" && (
          <View className="flex-1 items-center justify-center pt-20">
            <View className="h-28 w-28 items-center justify-center rounded-full bg-green-100">
              <Ionicons name="checkmark-circle" size={56} color="#10B981" />
            </View>
            <Text className="mt-8 text-center text-[28px] font-bold tracking-tight text-ink">
              {t("signup.successTitle")}
            </Text>
            <Text className="mt-3 text-center text-[15px] leading-relaxed text-soft">
              {t("signup.successBody")}
            </Text>
            <View className="mt-12 w-full">
              <Button
                title={t("signup.goToHome")}
                onPress={finishSignup}
                testID="signup-go-home"
              />
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
