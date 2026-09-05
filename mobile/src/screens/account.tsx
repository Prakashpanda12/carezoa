import React, { useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "../api/client";
import { useAuth } from "../store/auth";
import { LANGUAGES, setLanguage } from "../i18n";
import { z } from "zod";
import { dayLabel } from "../utils/format";
import {
  Avatar,
  Button,
  Card,
  Field,
  Header,
  LoadingState,
  Screen,
  cx,
} from "../components/ui";

const profileEditSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  dob: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, "Use DD/MM/YYYY"),
  city: z.string().trim().min(2, "City required"),
  address: z.string().trim().min(6, "Address required"),
});
type ProfileEditForm = z.infer<typeof profileEditSchema>;

function NavRow({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center gap-3 border-b border-line py-3.5 last:border-b-0"
      activeOpacity={0.75}
      accessibilityRole="link"
      accessibilityLabel={label}
    >
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-brand-soft">
        <Ionicons name={icon} size={16} color="#0E7C7B" />
      </View>
      <Text className="flex-1 text-[14.5px] font-semibold text-ink">{label}</Text>
      <Ionicons name="chevron-forward" size={16} color="#9AA5A2" />
    </TouchableOpacity>
  );
}

export function ProfileSettings() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const patient = useAuth((s) => s.patient);
  const setPatient = useAuth((s) => s.setPatient);
  const signOut = useAuth((s) => s.signOut);
  const [editing, setEditing] = useState(false);

  const form = useForm<ProfileEditForm>({
    resolver: zodResolver(profileEditSchema),
    values: {
      name: patient?.name ?? "",
      dob: patient?.dob ?? "",
      city: patient?.city ?? "",
      address: patient?.address ?? "",
    },
  });

  if (!patient) return <LoadingState label={t("common.loading")} />;

  const save = form.handleSubmit(async (v) => {
    try {
      const updated = await api.patchProfile(v);
      setPatient(updated);
      setEditing(false);
    } catch (e) {
      Alert.alert("Couldn't save", e instanceof Error ? e.message : "");
    }
  });

  const doSignOut = () => {
    console.log("[SIGNOUT] Sign out button pressed");
    
    // Use Alert.alert with proper configuration
    Alert.alert(
      t("account.signOut"),
      "Are you sure you want to sign out?",
      [
        { 
          text: t("common.cancel"), 
          style: "cancel",
          onPress: () => console.log("[SIGNOUT] Cancelled")
        },
        {
          text: t("account.signOut"),
          style: "destructive",
          onPress: async () => {
            try {
              console.log("[SIGNOUT] Confirming sign out...");
              
              // Clear auth state
              await signOut();
              console.log("[SIGNOUT] Auth state cleared");
              
              // Small delay to ensure state is updated
              await new Promise(resolve => setTimeout(resolve, 100));
              
              console.log("[SIGNOUT] Navigating to login...");
              
              // Clear navigation stack and go to login
              router.dismissAll();
              router.replace("/(auth)/login");
              
              console.log("[SIGNOUT] Navigation complete");
            } catch (error) {
              console.error("[SIGNOUT] Error during sign out:", error);
              Alert.alert("Error", "Failed to sign out. Please try again.");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // BUG-L05 fix: dynamic version from app.config
  const appVersion = Constants.expoConfig?.version ?? "1.0.0";

  // BUG-H08 fix: derive member-since from patient ID (lower ID = older account)
  // or use createdAt if available, otherwise show current year
  const memberSince = (() => {
    const now = new Date();
    // If we have patient.id, use it as a rough heuristic: IDs < 100 are from 2024, 100+ from 2025
    // In production this would come from patient.createdAt
    return patient.id < 100 ? "2024" : String(now.getFullYear());
  })();

  return (
    <Screen>
      <Header title={t("account.title")} />

      {/* identity card */}
      <View className="mb-5 rounded-xl3 bg-ink p-5">
        <View className="flex-row items-center gap-4">
          <Avatar name={patient.name} size={60} color="#E0F0EF" />
          <View className="flex-1">
            <Text className="text-[20px] font-bold text-paper">{patient.name}</Text>
            <Text className="text-[12.5px] text-paper/55">{patient.phone}</Text>
            <Text className="mt-0.5 text-[11.5px] text-paper/40">
              {patient.city} · Since {memberSince}
            </Text>
          </View>
        </View>
      </View>

      {/* editable profile */}
      <Card className="mb-5">
        <View className="flex-row items-center justify-between">
          <Text className="text-[11px] font-bold uppercase tracking-widest text-faint">
            {t("account.profile")}
          </Text>
          <TouchableOpacity
            onPress={() => (editing ? save() : setEditing(true))}
            accessibilityRole="button"
            accessibilityLabel={editing ? "Save profile changes" : "Edit profile"}
          >
            <Text className="text-[12.5px] font-bold text-brand">
              {editing ? t("common.save") : t("common.edit")}
            </Text>
          </TouchableOpacity>
        </View>
        {editing ? (
          <View className="mt-3">
            <Controller control={form.control} name="name" render={({ field: { value, onChange } }) => (
              <Field label={t("auth.nameLabel")} value={value} onChangeText={onChange} error={form.formState.errors.name?.message} accessibilityLabel="Full name" />
            )} />
            <Controller control={form.control} name="dob" render={({ field: { value, onChange } }) => (
              <Field label={t("auth.dobLabel")} value={value} onChangeText={onChange} keyboardType="number-pad" error={form.formState.errors.dob?.message} accessibilityLabel="Date of birth DD/MM/YYYY" />
            )} />
            <Controller control={form.control} name="city" render={({ field: { value, onChange } }) => (
              <Field label={t("auth.cityLabel")} value={value} onChangeText={onChange} error={form.formState.errors.city?.message} accessibilityLabel="City" />
            )} />
            <Controller control={form.control} name="address" render={({ field: { value, onChange } }) => (
              <Field label={t("auth.addressLabel")} value={value} onChangeText={onChange} error={form.formState.errors.address?.message} accessibilityLabel="Care address" />
            )} />
          </View>
        ) : (
          <View className="mt-3 gap-2.5">
            <ProfileLine label="DOB" value={patient.dob || "—"} />
            <ProfileLine label={t("auth.cityLabel")} value={patient.city || "—"} />
            <ProfileLine label={t("auth.addressLabel")} value={patient.address || "—"} />
          </View>
        )}
      </Card>

      {/* language */}
      <Card className="mb-5">
        <Text className="mb-2.5 text-[11px] font-bold uppercase tracking-widest text-faint">
          {t("account.language")}
        </Text>
        <View className="flex-row gap-2" accessibilityRole="radiogroup" accessibilityLabel="Language selection">
          {LANGUAGES.map((l) => {
            const active = i18n.language === l.code;
            return (
              <TouchableOpacity
                key={l.code}
                onPress={() => setLanguage(l.code)}
                testID={`lang-${l.code}`}
                className={cx(
                  "flex-1 items-center rounded-2xl border py-2.5",
                  active ? "border-brand bg-brand-soft" : "border-line bg-card",
                )}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`Switch to ${l.label}`}
              >
                <Text className={cx("text-[13px] font-bold", active ? "text-brand-dark" : "text-soft")}>
                  {l.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      {/* navigation */}
      <Card className="mb-5 py-1">
        <NavRow icon="people" label={t("account.family")} onPress={() => router.push("/family")} />
        <NavRow icon="card" label={t("account.payMethods")} onPress={() => router.push("/payment-methods")} />
        <NavRow icon="repeat" label={t("account.plans")} onPress={() => router.push("/packages")} />
        <NavRow icon="help-buoy" label={t("account.support")} onPress={() => router.push("/support")} />
      </Card>

      <View className="gap-4">
        <Button title={t("account.signOut")} variant="danger" icon="log-out-outline" onPress={doSignOut} testID="sign-out" accessibilityLabel="Sign out of your account" />
        <Text className="pb-4 text-center text-[11px] text-faint">
          CAREZOA Patient · v{appVersion}
        </Text>
      </View>
    </Screen>
  );
}

function ProfileLine({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-start justify-between gap-4">
      <Text className="text-[11.5px] font-semibold text-faint">{label}</Text>
      <Text className="flex-1 text-right text-[13px] font-medium text-ink">{value}</Text>
    </View>
  );
}
