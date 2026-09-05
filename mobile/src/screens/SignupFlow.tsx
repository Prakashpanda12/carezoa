import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Linking,
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
import { api } from "../api/client";
import { useAuth } from "../store/auth";
import {
  phoneSchema,
  otpSchema,
  profileSetupSchema,
  type PhoneForm,
  type OtpForm,
  type ProfileSetupForm,
} from "../utils/schemas";
import { Button, Field, Card, cx } from "../components/ui";

type SignupStep = "welcome" | "phone" | "details" | "otp" | "terms" | "success";

export function SignupFlow() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setSession = useAuth((s) => s.setSession);
  const setPatient = useAuth((s) => s.setPatient);

  const [step, setStep] = useState<SignupStep>("welcome");
  const [phone, setPhone] = useState("");
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);
  const [collectedDetails, setCollectedDetails] = useState<ProfileSetupForm | null>(null);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState("");
  const [loadingMessage, setLoadingMessage] = useState("");

  const phoneForm = useForm<PhoneForm>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "+91" },
  });

  const detailsForm = useForm<ProfileSetupForm>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: { name: "", dob: "", gender: "F", city: "", address: "" },
  });

  const otpForm = useForm<OtpForm>({
    resolver: zodResolver(otpSchema),
    defaultValues: { code: "" },
  });

  const [termsAccepted, setTermsAccepted] = useState(false);

  // Step 1: Check phone and determine flow
  const handlePhoneSubmit = phoneForm.handleSubmit(async (v) => {
    setBusy(true);
    setServerError("");
    try {
      const normalizedPhone = v.phone.replace(/[\s-]/g, "");
      const checkResult = await api.checkPhone(normalizedPhone);
      
      setPhone(normalizedPhone);
      setIsNewUser(!checkResult.exists);
      
      if (checkResult.exists) {
        // Existing user - request OTP directly
        setLoadingMessage("Sending verification code...");
        await api.otpRequest(normalizedPhone);
        setStep("otp");
      } else {
        // New user - collect details first
        setStep("details");
      }
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Failed to check phone number");
    } finally {
      setBusy(false);
      setLoadingMessage("");
    }
  });

  // Step 2: Collect details (new users only) and request OTP
  const handleDetailsSubmit = detailsForm.handleSubmit(async (v) => {
    setBusy(true);
    setServerError("");
    try {
      // Store details for later use
      setCollectedDetails(v);
      
      setLoadingMessage("Sending verification code...");
      await api.otpRequest(phone);
      setStep("otp");
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Failed to send OTP");
    } finally {
      setBusy(false);
      setLoadingMessage("");
    }
  });

  // Step 3: Verify OTP
  const verifyOtp = otpForm.handleSubmit(async (v) => {
    setBusy(true);
    setServerError("");
    setLoadingMessage("Verifying your code...");
    try {
      const result = await api.otpVerify(phone, v.code);
      
      setLoadingMessage("Setting up your account...");
      await setSession(result.access_token, null);
      
      // Fetch profile
      const profile = await api.getProfile();
      
      // If new user and we collected details, update profile now
      if (isNewUser && collectedDetails) {
        setLoadingMessage("Saving your details...");
        const updatedProfile = await api.patchProfile(collectedDetails);
        setPatient(updatedProfile);
      } else {
        setPatient(profile);
      }
      
      // Check if onboarding is complete
      if (profile.onboarding_done || (isNewUser && collectedDetails?.name && collectedDetails?.dob && collectedDetails?.gender)) {
        setStep("terms");
      } else {
        // Need to complete profile setup
        setStep("details");
      }
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setBusy(false);
      setLoadingMessage("");
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
    if (step === "otp") {
      if (isNewUser) {
        setStep("details");
      } else {
        setStep("phone");
      }
      otpForm.reset({ code: "" });
    } else if (step === "details") {
      setStep("phone");
      detailsForm.reset();
      setPhone("");
      setIsNewUser(null);
    } else if (step === "phone") {
      setStep("welcome");
      phoneForm.reset({ phone: "+91" });
    } else if (step === "terms") {
      setStep("otp");
    }
    setServerError("");
  };

  // Auto-format DOB as DD/MM/YYYY while typing
  const formatDob = (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
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
          <TouchableOpacity onPress={goBack} className="p-2" accessibilityLabel="Go back to previous step" accessibilityRole="button">
            <Ionicons name="arrow-back" size={24} color="#0E7C7B" />
          </TouchableOpacity>
          <Text className="ml-3 text-[16px] font-semibold text-ink">
            {isNewUser === false ? "Sign In" : t("signup.createAccount")}
          </Text>
        </View>
      )}

      {/* Loading overlay */}
      {loadingMessage && (
        <View className="absolute inset-0 z-50 items-center justify-center bg-paper/90">
          <View className="items-center rounded-2xl bg-card p-6 shadow-lg">
            <View className="mb-3 h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent"></View>
            <Text className="text-[14px] font-medium text-ink">{loadingMessage}</Text>
          </View>
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
            <View className="h-28 w-28 items-center justify-center rounded-full bg-brand-soft" accessibilityLabel="Carezoa heart logo">
              <Ionicons name="heart" size={56} color="#0E7C7B" />
            </View>
            <Text className="mt-8 text-center text-[32px] font-bold tracking-tight text-ink" accessibilityRole="header">
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
                accessibilityLabel="Create a new account or sign in"
              />
            </View>
          </View>
        )}

        {/* Phone Step */}
        {step === "phone" && (
          <View className="pt-8">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft">
              <Ionicons name="call" size={24} color="#0E7C7B" />
            </View>
            <Text className="mt-5 text-[26px] font-bold tracking-tight text-ink" accessibilityRole="header">
              Enter Your Phone Number
            </Text>
            <Text className="mt-1.5 text-[13.5px] text-soft">
              We'll send you a verification code to get started
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
                    accessibilityLabel="Phone number input"
                  />
                )}
              />
              <Text className="-mt-2 mb-3 text-[11.5px] text-faint">
                {t("auth.devCodeHint")}
              </Text>
              {!!serverError && (
                <Text className="mb-3 text-[13px] font-semibold text-danger" accessibilityRole="alert">
                  {serverError}
                </Text>
              )}
              <Button
                title="Continue"
                loading={busy}
                onPress={handlePhoneSubmit}
                testID="signup-continue-phone"
                accessibilityLabel="Continue with phone number"
              />
            </View>
          </View>
        )}

        {/* Details Step (New Users Only) */}
        {step === "details" && (
          <View className="pt-8">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft">
              <Ionicons name="person-add" size={24} color="#0E7C7B" />
            </View>
            <Text className="mt-5 text-[26px] font-bold tracking-tight text-ink" accessibilityRole="header">
              Tell Us About Yourself
            </Text>
            <Text className="mt-1.5 text-[13.5px] text-soft">
              Create your profile to get started with Carezoa
            </Text>

            <View className="mt-6">
              <Controller
                control={detailsForm.control}
                name="name"
                render={({ field: { value, onChange } }) => (
                  <Field
                    label="Full Name *"
                    icon="person-outline"
                    value={value}
                    onChangeText={onChange}
                    placeholder="Rahul Kumar"
                    error={detailsForm.formState.errors.name?.message}
                    testID="signup-name"
                    accessibilityLabel="Full name"
                  />
                )}
              />
              <Controller
                control={detailsForm.control}
                name="dob"
                render={({ field: { value, onChange } }) => (
                  <Field
                    label="Date of Birth"
                    icon="calendar-outline"
                    value={value}
                    onChangeText={(txt) => onChange(formatDob(txt))}
                    placeholder="14/09/1991"
                    keyboardType="number-pad"
                    error={detailsForm.formState.errors.dob?.message}
                    accessibilityLabel="Date of birth in DD/MM/YYYY format"
                  />
                )}
              />
              <Controller
                control={detailsForm.control}
                name="gender"
                render={({ field: { value, onChange } }) => (
                  <View className="mb-4" accessibilityRole="radiogroup" accessibilityLabel="Gender selection">
                    <Text className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-faint">
                      Gender
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
                          accessibilityRole="radio"
                          accessibilityState={{ selected: value === g.value }}
                          accessibilityLabel={g.label}
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
                control={detailsForm.control}
                name="city"
                render={({ field: { value, onChange } }) => (
                  <Field
                    label="City"
                    icon="business-outline"
                    value={value}
                    onChangeText={onChange}
                    placeholder="Bhubaneswar"
                    error={detailsForm.formState.errors.city?.message}
                    accessibilityLabel="City"
                  />
                )}
              />
              <Controller
                control={detailsForm.control}
                name="address"
                render={({ field: { value, onChange } }) => (
                  <Field
                    label="Address"
                    icon="home-outline"
                    value={value}
                    onChangeText={onChange}
                    multiline
                    placeholder="123 Main Street, Patia"
                    error={detailsForm.formState.errors.address?.message}
                    accessibilityLabel="Care address"
                  />
                )}
              />
              {!!serverError && (
                <Text className="mb-3 text-[13px] font-semibold text-danger" accessibilityRole="alert">
                  {serverError}
                </Text>
              )}
              <Button
                title="Continue"
                loading={busy}
                onPress={handleDetailsSubmit}
                accessibilityLabel="Save details and send OTP"
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
            <Text className="mt-5 text-[26px] font-bold tracking-tight text-ink" accessibilityRole="header">
              Verify Your Phone
            </Text>
            <Text className="mt-1.5 text-[13.5px] text-soft">
              Enter the 6-digit code sent to {phone}
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
                    accessibilityLabel="6-digit verification code"
                    autoFocus
                  />
                )}
              />
              {!!serverError && (
                <Text className="mb-3 text-[13px] font-semibold text-danger" accessibilityRole="alert">
                  {serverError}
                </Text>
              )}
              <Button
                title={t("auth.verify")}
                loading={busy}
                onPress={verifyOtp}
                testID="signup-verify-otp"
                accessibilityLabel="Verify OTP code"
              />
              <TouchableOpacity
                onPress={() => {
                  goBack();
                  setServerError("");
                }}
                className="mt-4 items-center"
                accessibilityRole="button"
                accessibilityLabel="Go back to change phone number"
              >
                <Text className="text-[13px] font-semibold text-brand">
                  Use a different phone number
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Terms Step */}
        {step === "terms" && (
          <View className="pt-8">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft">
              <Ionicons name="document-text" size={24} color="#0E7C7B" />
            </View>
            <Text className="mt-5 text-[26px] font-bold tracking-tight text-ink" accessibilityRole="header">
              {t("signup.termsTitle")}
            </Text>
            <Text className="mt-1.5 text-[13.5px] text-soft">
              {t("signup.termsBody")}
            </Text>

            <Card className="mt-6">
              <ScrollView 
                style={{ maxHeight: 300 }}
                nestedScrollEnabled
                showsVerticalScrollIndicator
              >
                <Text className="text-[13px] leading-relaxed text-soft">
                  {t("signup.termsContent")}
                </Text>
              </ScrollView>
            </Card>

            <TouchableOpacity
              onPress={() => setTermsAccepted(!termsAccepted)}
              className="mt-6 flex-row items-center"
              accessibilityRole="checkbox"
              accessibilityState={{ checked: termsAccepted }}
              accessibilityLabel={t("signup.acceptTerms")}
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

            <TouchableOpacity
              onPress={() => Linking.openURL("https://carezoa.com/terms").catch(() => {})}
              className="mt-2 items-center"
              accessibilityRole="link"
              accessibilityLabel="View full terms on website"
            >
              <Text className="text-[12px] font-semibold text-brand">
                View full terms on our website →
              </Text>
            </TouchableOpacity>

            {!!serverError && (
              <Text className="mt-3 text-[13px] font-semibold text-danger" accessibilityRole="alert">
                {serverError}
              </Text>
            )}

            <Button
              title={t("signup.completeSignup")}
              onPress={completeSignup}
              disabled={!termsAccepted}
              className="mt-6"
              accessibilityLabel="Complete registration"
            />
          </View>
        )}

        {/* Success Step */}
        {step === "success" && (
          <View className="flex-1 items-center justify-center pt-20">
            <View className="h-28 w-28 items-center justify-center rounded-full bg-green-100" accessibilityLabel="Success checkmark">
              <Ionicons name="checkmark-circle" size={56} color="#10B981" />
            </View>
            <Text className="mt-8 text-center text-[28px] font-bold tracking-tight text-ink" accessibilityRole="header">
              {isNewUser ? "Welcome to Carezoa!" : "Welcome Back!"}
            </Text>
            <Text className="mt-3 text-center text-[15px] leading-relaxed text-soft">
              {isNewUser 
                ? "Your account has been created successfully. You're all set to book healthcare services!"
                : "You've successfully signed in. Ready to continue your care journey!"
              }
            </Text>
            <View className="mt-12 w-full">
              <Button
                title={t("signup.goToHome")}
                onPress={finishSignup}
                testID="signup-go-home"
                accessibilityLabel="Go to home screen"
              />
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
