"use client";

import { motion } from "framer-motion";
import {
  Activity,
  CalendarDays,
  House,
  MessageCircle,
  Pill,
} from "lucide-react";

export type TabId = "today" | "schedule" | "meds" | "health" | "messages";

const TABS: { id: TabId; icon: typeof House; label: string }[] = [
  { id: "today", icon: House, label: "Today" },
  { id: "schedule", icon: CalendarDays, label: "Schedule" },
  { id: "meds", icon: Pill, label: "Meds" },
  { id: "health", icon: Activity, label: "Health" },
  { id: "messages", icon: MessageCircle, label: "Care" },
];

export default function TabBar({
  tab,
  onChange,
  unread,
}: {
  tab: TabId;
  onChange: (t: TabId) => void;
  unread: number;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40">
      <div className="pointer-events-auto flex items-center justify-between rounded-full border border-white/[0.08] bg-[#16130D]/90 p-1.5 shadow-[0_18px_50px_-12px_rgba(25,22,17,0.55)] backdrop-blur-xl">
        {TABS.map((t) => {
          const active = tab === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              aria-label={t.label}
              className="relative flex h-11 flex-1 items-center justify-center rounded-full"
            >
              {active && (
                <motion.span
                  layoutId="tab-pill"
                  className="absolute inset-0 rounded-full bg-cream"
                  transition={{ type: "spring", stiffness: 480, damping: 38 }}
                />
              )}
              <span
                className={`relative z-10 transition-colors ${
                  active ? "text-ink" : "text-white/50 hover:text-white/80"
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.4 : 2} />
              </span>
              {t.id === "messages" && unread > 0 && (
                <span className="absolute top-1.5 right-[22%] z-20 grid size-4 place-items-center rounded-full bg-ember text-[9px] font-bold text-white ring-2 ring-[#16130D]">
                  {unread}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
