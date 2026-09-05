import React, { useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { keys, useFamily } from "../api/hooks";
import { useAuth, type ViewerMode } from "../store/auth";
import { familyInviteSchema, type FamilyInviteForm } from "../utils/schemas";
import type { FamilyMember } from "../types/api";
import {
  Avatar,
  Button,
  Card,
  Chip,
  ErrorState,
  Field,
  Header,
  LoadingState,
  Screen,
  SwitchRow,
  cx,
} from "../components/ui";

function ScopeChips({ scope, t }: { scope: FamilyMember["accessScope"]; t: (k: string) => string }) {
  return (
    <View className="mt-2 flex-row flex-wrap gap-1.5">
      {scope.viewVisits && <Chip tone="brand" label={t("family.scopeVisits")} />}
      {scope.viewRecords && <Chip tone="brand" label={t("family.scopeRecords")} />}
      {scope.chat && <Chip tone="brand" label={t("family.scopeChat")} />}
      {!scope.viewVisits && !scope.viewRecords && !scope.chat && (
        <Chip tone="neutral" label="No access" />
      )}
    </View>
  );
}

export function FamilyMembers() {
  const { t } = useTranslation();
  const router = useRouter();
  const qc = useQueryClient();
  const family = useFamily();
  const viewer = useAuth((s) => s.viewer);
  const setViewer = useAuth((s) => s.setViewer);
  const [inviting, setInviting] = useState(false);
  const [scope, setScope] = useState({ viewVisits: true, viewRecords: false, chat: false });
  const form = useForm<FamilyInviteForm>({
    resolver: zodResolver(familyInviteSchema),
    defaultValues: { name: "", relation: "", phone: "+91" },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: keys.family });

  const invite = form.handleSubmit(async (v) => {
    try {
      await api.inviteFamily({ ...v, accessScope: scope });
      form.reset();
      setScope({ viewVisits: true, viewRecords: false, chat: false });
      setInviting(false);
      refresh();
    } catch (e) {
      Alert.alert("Couldn't invite", e instanceof Error ? e.message : "");
    }
  });

  const patch = async (id: number, body: unknown) => {
    try {
      await api.patchFamily(id, body);
      refresh();
    } catch (e) {
      Alert.alert("Couldn't update", e instanceof Error ? e.message : "");
    }
  };

  const toggleViewer = (m: FamilyMember) => {
    if (viewer?.id === m.id) setViewer(null);
    else setViewer({ id: m.id, name: m.name, accessScope: m.accessScope } as ViewerMode);
  };

  return (
    <Screen onRefresh={refresh} refreshing={family.isRefetching}>
      <Header
        title={t("family.title")}
        subtitle="Decide exactly what each member can see"
        onBack={() => router.back()}
        right={
          <TouchableOpacity
            onPress={() => setInviting((v) => !v)}
            className="h-10 w-10 items-center justify-center rounded-full bg-ink"
          >
            <Ionicons name={inviting ? "close" : "person-add"} size={16} color="#F6F4EE" />
          </TouchableOpacity>
        }
      />

      {viewer && (
        <View className="mb-4 flex-row items-center gap-2 rounded-2xl bg-brand-soft p-3">
          <Ionicons name="eye" size={14} color="#0E7C7B" />
          <Text className="flex-1 text-[12.5px] font-semibold text-brand-dark">
            {t("home.viewingAs", { name: viewer.name })}
          </Text>
          <TouchableOpacity onPress={() => setViewer(null)}>
            <Text className="text-[12px] font-bold text-brand-dark">{t("family.stopViewing")}</Text>
          </TouchableOpacity>
        </View>
      )}

      {inviting && (
        <Card className="mb-5">
          <Text className="mb-3 text-[15px] font-bold text-ink">{t("family.inviteTitle")}</Text>
          <Controller control={form.control} name="name" render={({ field: { value, onChange } }) => (
            <Field label={t("auth.nameLabel")} icon="person-outline" value={value} onChangeText={onChange} error={form.formState.errors.name?.message} />
          )} />
          <Controller control={form.control} name="relation" render={({ field: { value, onChange } }) => (
            <Field label={t("family.relationLabel")} icon="people-outline" value={value} onChangeText={onChange} placeholder="Father, Mother…" error={form.formState.errors.relation?.message} />
          )} />
          <Controller control={form.control} name="phone" render={({ field: { value, onChange } }) => (
            <Field label={t("auth.phoneLabel")} icon="call-outline" value={value} onChangeText={onChange} keyboardType="phone-pad" error={form.formState.errors.phone?.message} />
          )} />
          <View className="mb-4 border-t border-line pt-2">
            <SwitchRow label={t("family.scopeVisits")} value={scope.viewVisits} onChange={(v) => setScope((s) => ({ ...s, viewVisits: v }))} />
            <SwitchRow label={t("family.scopeRecords")} value={scope.viewRecords} onChange={(v) => setScope((s) => ({ ...s, viewRecords: v }))} />
            <SwitchRow label={t("family.scopeChat")} value={scope.chat} onChange={(v) => setScope((s) => ({ ...s, chat: v }))} />
          </View>
          <Button title={t("family.inviteBtn")} onPress={invite} testID="family-invite" />
        </Card>
      )}

      {family.isLoading && <LoadingState />}
      {family.isError && <ErrorState label="Couldn't load members." onRetry={() => family.refetch()} />}
      {family.data?.items.map((m) => {
        const revoked = m.inviteStatus === "revoked";
        return (
          <Card key={m.id} className={cx("mb-3", revoked && "opacity-50")}>
            <View className="flex-row items-center gap-3">
              <Avatar name={m.name} size={44} />
              <View className="flex-1">
                <Text className="text-[15px] font-bold text-ink">{m.name}</Text>
                <Text className="text-[12px] text-soft">{m.relation} · {m.phone}</Text>
              </View>
              <Chip
                tone={m.inviteStatus === "active" ? "success" : m.inviteStatus === "pending" ? "warn" : "danger"}
                label={t(`family.${m.inviteStatus}`)}
              />
            </View>
            <ScopeChips scope={m.accessScope} t={t} />
            <View className="mt-3 flex-row flex-wrap gap-2 border-t border-line pt-3">
              {!revoked && (
                <Button
                  title={viewer?.id === m.id ? t("family.stopViewing") : t("family.viewAs", { name: m.name.split(" ")[0] })}
                  small
                  variant="ghost"
                  icon="eye-outline"
                  onPress={() => toggleViewer(m)}
                />
              )}
              {m.inviteStatus === "pending" && (
                <Button title={t("family.acceptSim")} small variant="ghost" icon="checkmark-done" onPress={() => patch(m.id, { action: "simulate_accept" })} />
              )}
              {!revoked && (
                <Button title={t("family.revoke")} small variant="danger" icon="close" onPress={() => patch(m.id, { action: "revoke" })} />
              )}
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}
