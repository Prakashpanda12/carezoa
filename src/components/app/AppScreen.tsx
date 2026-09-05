"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Leaf, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import TabBar, { type TabId } from "./TabBar";
import { ToastViewport } from "./providers";
import Today from "../screens/Today";
import Schedule from "../screens/Schedule";
import Meds from "../screens/Meds";
import Health from "../screens/Health";
import MessagesScreen from "../screens/Messages";
import Profile from "../screens/Profile";

function Splash() {
  return (
    <div className="grid h-full place-items-center bg-paper">
      <div className="flex flex-col items-center gap-4">
        <motion.div
          animate={{ scale: [1, 1.08, 1], rotate: [0, 4, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          className="grid size-16 place-items-center rounded-[22px] bg-leaf/15 text-leaf ring-1 ring-leaf/25"
        >
          <Leaf size={28} strokeWidth={2} />
        </motion.div>
        <motion.p
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.2, repeat: Infinity }}
          className="font-display text-xl text-ink-soft italic"
        >
          Waking up your record…
        </motion.p>
      </div>
    </div>
  );
}

function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="grid h-full place-items-center bg-paper px-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="font-display text-2xl text-ink italic">We lost the thread</p>
        <p className="text-[13px] text-ink-soft">
          Couldn&apos;t reach the care API. Check that the server is running and
          try again.
        </p>
        <button
          onClick={onRetry}
          className="mt-2 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[13px] font-semibold text-cream transition hover:bg-black"
        >
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    </div>
  );
}

export default function AppScreen() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["bootstrap"],
    queryFn: api.getBootstrap,
  });
  const [tab, setTab] = useState<TabId>("today");
  const [profileOpen, setProfileOpen] = useState(false);
  const [lastSeenMsgs, setLastSeenMsgs] = useState<string>(
    () => new Date().toISOString(),
  );

  useEffect(() => {
    if (tab === "messages") setLastSeenMsgs(new Date().toISOString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  if (isLoading) return <Splash />;
  if (isError || !data) return <LoadError onRetry={() => refetch()} />;

  const unread = data.messages.filter(
    (m) =>
      m.sender === "care_team" &&
      m.createdAt <= new Date().toISOString() &&
      m.createdAt > lastSeenMsgs,
  ).length;

  const screens: Record<TabId, ReactNode> = {
    today: (
      <Today data={data} onGo={setTab} onOpenProfile={() => setProfileOpen(true)} />
    ),
    schedule: <Schedule data={data} />,
    meds: <Meds data={data} />,
    health: <Health data={data} />,
    messages: <MessagesScreen data={data} />,
  };

  return (
    <div className="relative flex h-full flex-col bg-paper">
      <div className="relative min-h-0 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.3, 0.7, 0.3, 1] }}
            className="app-scroll h-full overflow-y-auto pt-14"
          >
            {screens[tab]}
          </motion.div>
        </AnimatePresence>
      </div>

      <TabBar tab={tab} onChange={setTab} unread={unread} />
      <ToastViewport />
      <Profile
        patient={data.patient}
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
    </div>
  );
}
