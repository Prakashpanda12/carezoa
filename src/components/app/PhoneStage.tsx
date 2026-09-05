"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Activity as ActivityIcon,
  BatteryFull,
  HeartPulse,
  Leaf,
  Signal,
  Sparkles,
  Wifi,
} from "lucide-react";
import { api } from "@/lib/api";
import AppScreen from "./AppScreen";

const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")";

function StatusBar() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 10_000);
    return () => window.clearInterval(id);
  }, []);
  const hh = now.getHours() % 12 || 12;
  const mm = String(now.getMinutes()).padStart(2, "0");
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex h-12 items-center justify-between px-7 pt-2 text-ink">
      <span className="min-w-12 text-[13px] font-semibold tracking-tight">
        {hh}:{mm}
      </span>
      <div className="hidden lg:block">
        <div className="h-[26px] w-28 rounded-full bg-black" />
      </div>
      <span className="flex min-w-12 items-center justify-end gap-1.5">
        <Signal size={13} strokeWidth={2.5} />
        <Wifi size={14} strokeWidth={2.5} />
        <BatteryFull size={17} strokeWidth={2} />
      </span>
    </div>
  );
}

/** Ambient live-data widgets floating around the device (desktop only). */
function AmbientWidgets() {
  const { data } = useQuery({
    queryKey: ["bootstrap"],
    queryFn: api.getBootstrap,
    retry: 0,
  });
  if (!data) return null;
  const bp = data.vitals.blood_pressure.at(-1);
  const adherence = Math.round(data.adherence7 * 100);
  const latestNote = [...data.messages]
    .reverse()
    .find((m) => m.sender === "care_team");

  const widget =
    "rounded-3xl border border-white/[0.08] bg-white/[0.04] p-4 backdrop-blur-xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]";

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
        className={`absolute left-[7%] top-[22%] hidden w-60 xl:block ${widget}`}
      >
        <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em] text-white/40 uppercase">
          <HeartPulse size={13} className="text-blush" /> Latest reading
        </div>
        <p className="font-display text-3xl text-white italic">
          {bp ? `${Math.round(bp.value ?? 0)}/${Math.round(bp.value2 ?? 0)}` : "—"}
          <span className="ml-2 font-sans text-xs font-medium not-italic text-white/40">
            mmHg
          </span>
        </p>
        <p className="mt-1 text-[12px] text-white/45">Synced to the health log</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
        className={`absolute right-[7%] top-[30%] hidden w-60 xl:block ${widget}`}
      >
        <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em] text-white/40 uppercase">
          <ActivityIcon size={13} className="text-leaf" /> 7-day adherence
        </div>
        <p className="font-display text-3xl text-white italic">
          {adherence}
          <span className="ml-1 font-sans text-xs font-medium not-italic text-white/40">
            % of doses taken
          </span>
        </p>
        <p className="mt-1 text-[12px] text-white/45">Medications, on schedule</p>
      </motion.div>

      {latestNote && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
          className={`absolute bottom-[16%] left-[9%] hidden w-64 xl:block ${widget}`}
        >
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em] text-white/40 uppercase">
            <Sparkles size={13} className="text-gold" /> From your care team
          </div>
          <p className="line-clamp-3 text-[13px] leading-relaxed text-white/60">
            “{latestNote.body}”
          </p>
          <p className="mt-2 text-[11px] font-semibold text-white/35">
            {latestNote.authorName} · {latestNote.authorRole}
          </p>
        </motion.div>
      )}
    </>
  );
}

export default function PhoneStage() {
  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#0B0D0B]">
      {/* ambient backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(90% 60% at 50% -10%, rgba(22,163,123,0.16) 0%, rgba(22,163,123,0) 60%), radial-gradient(60% 50% at 90% 100%, rgba(233,161,59,0.10) 0%, rgba(233,161,59,0) 60%), #0B0D0B",
        }}
      />
      <motion.div
        className="absolute -top-40 left-[15%] size-[34rem] rounded-full bg-leaf/25 blur-[130px]"
        animate={{ x: [0, 60, -20, 0], y: [0, 30, 60, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[10%] bottom-[-10rem] size-[30rem] rounded-full bg-gold/15 blur-[130px]"
        animate={{ x: [0, -50, 20, 0], y: [0, -40, -10, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-[35%] left-[55%] size-[22rem] rounded-full bg-lilac/10 blur-[120px]"
        animate={{ x: [0, -70, 30, 0], y: [0, 40, -30, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{ backgroundImage: NOISE }}
      />

      {/* brand row */}
      <header className="absolute inset-x-0 top-0 z-10 hidden items-center justify-between px-10 py-7 lg:flex">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-leaf/15 text-leaf ring-1 ring-leaf/25">
            <Leaf size={17} strokeWidth={2.2} />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-white">
            Solace <span className="font-normal text-white/40">Health</span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-white/35 uppercase">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-leaf opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-leaf" />
          </span>
          Live · Postgresql-backed companion
        </div>
      </header>

      {/* giant word */}
      <div className="pointer-events-none absolute inset-0 z-[1] hidden items-center justify-center lg:flex">
        <motion.span
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, ease: [0.2, 0.8, 0.2, 1] }}
          className="font-display bg-gradient-to-b from-white/[0.13] via-white/[0.05] to-transparent bg-clip-text text-[clamp(10rem,24vw,24rem)] leading-none italic select-none"
          style={{ WebkitTextFillColor: "transparent" }}
        >
          Solace
        </motion.span>
      </div>

      <AmbientWidgets />

      {/* caption */}
      <div className="absolute inset-x-0 bottom-7 z-10 hidden justify-center lg:flex">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 1 }}
          className="text-[13px] text-white/35"
        >
          Your health, gently kept —{" "}
          <span className="font-display italic text-white/55">
            appointments, meds, vitals &amp; care team, one tap away.
          </span>
        </motion.p>
      </div>

      {/* the device */}
      <div className="relative z-[5] flex h-full w-full items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.1, ease: [0.2, 0.8, 0.2, 1] }}
          className="relative h-dvh w-full lg:h-[min(880px,93dvh)] lg:w-auto lg:aspect-[390/856] lg:rounded-[58px] lg:bg-gradient-to-b lg:from-[#2a2c28] lg:to-[#171813] lg:p-[11px] lg:shadow-[0_80px_140px_-40px_rgba(0,0,0,0.85),0_40px_90px_-40px_rgba(22,163,123,0.22)] lg:ring-1 lg:ring-white/10"
        >
          <div className="relative h-full w-full overflow-hidden bg-paper lg:rounded-[47px]">
            <StatusBar />
            <AppScreen />
          </div>
          {/* home indicator */}
          <div className="pointer-events-none absolute bottom-[1px] left-1/2 z-50 hidden h-[18px] w-full -translate-x-1/2 items-start justify-center pt-1 lg:flex">
            <div className="h-[5px] w-32 rounded-full bg-ink/25 mix-blend-multiply" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
