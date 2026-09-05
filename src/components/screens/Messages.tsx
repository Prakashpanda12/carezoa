"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { isSameDay } from "date-fns";
import { Mic, Send } from "lucide-react";
import { api } from "@/lib/api";
import type { BootstrapDto, MessageDto } from "@/lib/types";
import { CARE_TEAM } from "@/lib/constants";
import { dayLabel, timeOf } from "@/lib/format";
import { useToast } from "../app/providers";
import { Avatar } from "../app/ui";
import clsx from "clsx";

const QUICK = [
  "Refill my Metformin, please",
  "I'd like to book a visit",
  "Question about a side effect",
  "When will my lab results post?",
];

function CareBubble({ m }: { m: MessageDto }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="flex items-end gap-2.5 pr-10"
    >
      <Avatar name={m.authorName} size={30} />
      <div className="min-w-0">
        <p className="mb-1 ml-1 text-[10.5px] font-semibold text-ink-faint">
          {m.authorName} · {m.authorRole}
        </p>
        <div className="rounded-[22px] rounded-bl-md border border-line bg-card px-4 py-3 text-[14px] leading-relaxed text-ink shadow-[0_1px_0_rgba(25,22,17,0.04)]">
          {m.body}
        </div>
        <p className="mt-1 ml-1 text-[10px] text-ink-faint">{timeOf(m.createdAt)}</p>
      </div>
    </motion.div>
  );
}

function PatientBubble({ m }: { m: MessageDto }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="flex justify-end pl-10"
    >
      <div className="text-right">
        <div className="rounded-[22px] rounded-br-md bg-ink px-4 py-3 text-left text-[14px] leading-relaxed text-cream">
          {m.body}
        </div>
        <p className="mt-1 mr-1 text-[10px] text-ink-faint">{timeOf(m.createdAt)}</p>
      </div>
    </motion.div>
  );
}

function TypingBubble({ name }: { name: string }) {
  return (
    <div className="flex items-end gap-2.5 pr-10">
      <Avatar name={name} size={30} />
      <div className="flex items-center gap-1.5 rounded-[22px] rounded-bl-md border border-line bg-card px-4 py-3.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-1.5 rounded-full bg-ink-faint"
            animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
}

export default function MessagesScreen({ data }: { data: BootstrapDto }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [draft, setDraft] = useState("");
  const [tick, setTick] = useState(() => Date.now());
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const visible = useMemo(
    () => data.messages.filter((m) => +new Date(m.createdAt) <= tick),
    [data.messages, tick],
  );
  const pendingReply = data.messages.find(
    (m) => m.sender === "care_team" && +new Date(m.createdAt) > tick,
  );

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [visible.length, !!pendingReply]);

  const mut = useMutation({
    mutationFn: (body: string) => api.sendMessage(body),
    onSuccess: ({ sent, reply }) => {
      qc.setQueryData<BootstrapDto>(["bootstrap"], (old) =>
        old
          ? {
              ...old,
              messages: old.messages.some((m) => m.id === sent.id)
                ? old.messages
                : [...old.messages, sent, reply],
            }
          : old,
      );
      qc.invalidateQueries({ queryKey: ["bootstrap"] });
    },
    onError: () => toast.push("Message didn't send", "error"),
  });

  const send = (body: string) => {
    const text = body.trim();
    if (!text || mut.isPending) return;
    setDraft("");
    mut.mutate(text);
  };

  return (
    <div className="flex h-full flex-col">
      {/* header */}
      <div className="px-5 pb-3">
        <h1 className="text-[30px] leading-tight font-semibold tracking-tight text-ink">
          <span className="font-display italic">Care team</span>
        </h1>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex -space-x-2">
            {CARE_TEAM.map((c) => (
              <Avatar key={c.name} name={c.name} size={30} className="ring-2 ring-paper" />
            ))}
          </div>
          <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-ink-soft">
            <span className="size-1.5 rounded-full bg-leaf" />
            Typically replies within 2 hours
          </span>
        </div>
      </div>

      {/* thread */}
      <div
        ref={listRef}
        className="app-scroll min-h-0 flex-1 space-y-3 overflow-y-auto border-t border-line/60 px-5 py-4"
      >
        {visible.map((m, i) => {
          const prev = visible[i - 1];
          const newDay =
            !prev || !isSameDay(new Date(prev.createdAt), new Date(m.createdAt));
          return (
            <div key={m.id} className="space-y-3">
              {newDay && (
                <div className="flex justify-center py-1">
                  <span className="rounded-full bg-ink/[0.05] px-3 py-1 text-[10.5px] font-semibold text-ink-faint">
                    {dayLabel(m.createdAt)}
                  </span>
                </div>
              )}
              {m.sender === "patient" ? <PatientBubble m={m} /> : <CareBubble m={m} />}
            </div>
          );
        })}
        {pendingReply && <TypingBubble name={pendingReply.authorName} />}
      </div>

      {/* quick prompts + composer */}
      <div className="space-y-2.5 px-4 pt-2 pb-[104px]">
        <div className="app-scroll -mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5">
          {QUICK.map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              className="shrink-0 rounded-full border border-line bg-card px-3.5 py-1.5 text-[12px] font-medium text-ink-soft transition hover:border-leaf/40 hover:text-moss"
            >
              {q}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(draft);
          }}
          className="flex items-center gap-2"
        >
          <div className="flex flex-1 items-center gap-1 rounded-full border border-line bg-card py-1.5 pr-1.5 pl-4 focus-within:border-leaf focus-within:ring-2 focus-within:ring-leaf/25">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Message your care team…"
              maxLength={500}
              className={clsx(
                "min-w-0 flex-1 bg-transparent text-[14px] text-ink placeholder:text-ink-faint",
              )}
            />
            <button
              type="button"
              onClick={() => toast.push("Voice notes coming soon")}
              className="grid size-9 shrink-0 place-items-center rounded-full text-ink-faint transition hover:bg-ink/5"
              aria-label="Voice note"
            >
              <Mic size={16} />
            </button>
          </div>
          <motion.button
            whileTap={{ scale: 0.88 }}
            type="submit"
            disabled={!draft.trim() || mut.isPending}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-leaf text-white shadow-[0_8px_20px_-6px_rgba(22,163,123,0.6)] transition disabled:bg-ink/20 disabled:shadow-none"
            aria-label="Send"
          >
            <Send size={17} className="translate-x-[1px]" />
          </motion.button>
        </form>
      </div>
    </div>
  );
}
