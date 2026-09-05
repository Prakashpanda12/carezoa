import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { keys, useBooking, useMessages } from "../api/hooks";
import { containsContactInfo } from "../utils/schemas";
import { timeOf } from "../utils/format";
import { ErrorState, Header, LoadingState } from "../components/ui";
import { cx } from "../components/ui";

export function Messages() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const qc = useQueryClient();
  const messages = useMessages(id ?? "");
  const booking = useBooking(id ?? "", 0);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const items = messages.data?.items ?? [];
  // BUG-H04 fix: instead of a 1-second interval that causes re-renders every second,
  // only schedule a single timeout for the next pending message's reveal time
  const [revealTick, setRevealTick] = useState(Date.now());
  useEffect(() => {
    const now = Date.now();
    const nextPending = items.find((m) => m.sender === "provider" && +new Date(m.createdAt) > now);
    if (!nextPending) return;
    const delay = Math.max(0, +new Date(nextPending.createdAt) - now + 100);
    const timer = setTimeout(() => setRevealTick(Date.now()), delay);
    return () => clearTimeout(timer);
  }, [items]);

  const visible = items.filter((m) => +new Date(m.createdAt) <= revealTick);
  const pending = items.find((m) => m.sender === "provider" && +new Date(m.createdAt) > revealTick);

  const send = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    // Anti-bypass: block contact sharing even before the server scrubs it.
    if (containsContactInfo(body)) {
      Alert.alert(
        "Number stays private",
        "For everyone's safety, phone numbers, emails and social handles can't be shared. CAREZOA connects you through masked calls and this chat.",
      );
      return;
    }
    setSending(true);
    setDraft("");
    try {
      const res = await api.sendMessage(id!, body);
      qc.setQueryData<{ items: typeof visible }>(keys.messages(id ?? ""), (old) => ({
        items: old ? [...old.items, res.sent, res.reply] : [res.sent, res.reply],
      }));
    } catch (e) {
      setDraft(body);
      Alert.alert("Message failed", e instanceof Error ? e.message : "");
    } finally {
      setSending(false);
    }
  };

  if (messages.isLoading) return <LoadingState label={t("common.loading")} />;
  if (messages.isError) return <ErrorState label="Couldn't load messages." onRetry={() => messages.refetch()} />;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-paper"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <View className="flex-1 px-5 pt-2">
        <Header
          title={booking.data?.provider?.name ?? t("chat.title")}
          subtitle={booking.data?.provider?.title}
          onBack={() => router.back()}
        />
        <View className="mb-3 flex-row items-center gap-2 rounded-2xl bg-brand-soft px-3.5 py-2.5">
          <Ionicons name="lock-closed" size={12} color="#0E7C7B" />
          <Text className="flex-1 text-[11.5px] font-medium text-brand-dark">{t("chat.privacyNote")}</Text>
        </View>

        <ScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerClassName="gap-2.5 pb-3"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}
        >
          {visible.map((m) => {
            const mine = m.sender === "patient";
            return (
              <View key={m.id} className={cx("max-w-[82%]", mine ? "self-end items-end" : "self-start items-start")}>
                <View
                  className={cx(
                    "rounded-[20px] px-4 py-2.5",
                    mine ? "rounded-br-md bg-ink" : "rounded-bl-md border border-line bg-card",
                  )}
                >
                  <Text className={cx("text-[14px] leading-relaxed", mine ? "text-paper" : "text-ink")}>
                    {m.body}
                  </Text>
                </View>
                <Text className="mt-1 px-1 text-[10px] text-faint">
                  {mine ? timeOf(m.createdAt) : `${m.authorName} · ${timeOf(m.createdAt)}`}
                </Text>
              </View>
            );
          })}
          {pending && (
            <View className="self-start rounded-[20px] rounded-bl-md border border-line bg-card px-4 py-3">
              <Text className="text-[12px] font-semibold text-faint">{pending.authorName} {t("chat.typing")}</Text>
            </View>
          )}
        </ScrollView>

        <View className="flex-row items-center gap-2 pb-24 pt-1">
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={t("chat.placeholder")}
            placeholderTextColor="#9AA5A2"
            onSubmitEditing={send}
            returnKeyType="send"
            maxLength={500}
            className="flex-1 rounded-full border border-line bg-card px-4 py-3 text-[14px] text-ink"
            testID="chat-input"
          />
          <TouchableOpacity
            onPress={send}
            disabled={!draft.trim() || sending}
            className={cx("h-11 w-11 items-center justify-center rounded-full bg-brand", (!draft.trim() || sending) && "opacity-40")}
            testID="chat-send"
          >
            <Ionicons name="send" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
