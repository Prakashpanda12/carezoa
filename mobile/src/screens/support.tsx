import React, { useState } from "react";
import { Alert, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { keys, useTickets } from "../api/hooks";
import { ticketSchema, type TicketForm } from "../utils/schemas";
import { dayLabel } from "../utils/format";
import {
  Button,
  Card,
  Chip,
  ErrorState,
  Field,
  Header,
  LoadingState,
  Screen,
} from "../components/ui";

const TONE = { open: "warn", in_progress: "brand", resolved: "success" } as const;

export function Support() {
  const { t } = useTranslation();
  const router = useRouter();
  const qc = useQueryClient();
  const tickets = useTickets();
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const form = useForm<TicketForm>({
    resolver: zodResolver(ticketSchema),
    defaultValues: { subject: "", body: "" },
  });

  const submit = form.handleSubmit(async (v) => {
    setBusy(true);
    try {
      await api.createTicket(v.subject, v.body);
      form.reset();
      setShowForm(false);
      qc.invalidateQueries({ queryKey: keys.tickets });
    } catch (e) {
      Alert.alert("Couldn't submit", e instanceof Error ? e.message : "");
    } finally {
      setBusy(false);
    }
  });

  return (
    <Screen onRefresh={() => tickets.refetch()} refreshing={tickets.isRefetching}>
      <Header
        title={t("support.title")}
        subtitle={t("support.sla")}
        onBack={() => router.back()}
      />

      <View className="mb-4">
        <Button
          title={t("support.newTicket")}
          icon={showForm ? "close" : "add"}
          variant={showForm ? "ghost" : "secondary"}
          onPress={() => setShowForm((v) => !v)}
        />
      </View>

      {showForm && (
        <Card className="mb-5">
          <Controller control={form.control} name="subject" render={({ field: { value, onChange } }) => (
            <Field label={t("support.subjectLabel")} value={value} onChangeText={onChange} error={form.formState.errors.subject?.message} testID="ticket-subject" />
          )} />
          <Controller control={form.control} name="body" render={({ field: { value, onChange } }) => (
            <Field label={t("support.detailsLabel")} value={value} onChangeText={onChange} multiline error={form.formState.errors.body?.message} />
          )} />
          <Button title={t("support.submit")} loading={busy} onPress={submit} testID="ticket-submit" />
        </Card>
      )}

      {tickets.isLoading && <LoadingState />}
      {tickets.isError && <ErrorState label="Couldn't load tickets." onRetry={() => tickets.refetch()} />}
      {tickets.data?.items.map((ticket) => (
        <Card key={ticket.id} className="mb-3">
          <View className="flex-row items-center justify-between">
            <Text className="flex-1 text-[15px] font-bold text-ink" numberOfLines={1}>
              {ticket.subject}
            </Text>
            <Chip tone={TONE[ticket.status]} label={t(`support.${ticket.status}`)} />
          </View>
          <Text className="mt-1.5 text-[13px] leading-relaxed text-soft">{ticket.body}</Text>
          <Text className="mt-2 text-[11px] font-semibold text-faint">
            #{ticket.id} · {dayLabel(ticket.createdAt)}
          </Text>
        </Card>
      ))}
      {tickets.data?.items.length === 0 && (
        <Card>
          <Text className="text-[13px] text-soft">
            No tickets yet — we're here whenever you need us.
          </Text>
        </Card>
      )}
    </Screen>
  );
}
