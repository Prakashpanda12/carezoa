"use client";

import { motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  MapPin,
  Minus,
  Phone,
  Sparkles,
  Video,
} from "lucide-react";
import { format } from "date-fns";
import type { AppointmentDto, BootstrapDto } from "@/lib/types";
import { dayLabel, greeting, timeOf, until } from "@/lib/format";
import { VITAL_META } from "@/lib/constants";
import type { TabId } from "../app/TabBar";
import { useToast } from "../app/providers";
import { Avatar, Chip, SectionTitle } from "../app/ui";
import { Area } from "../app/charts";
import { DoseRow } from "./DoseRow";

const rise = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
};

function HeroCard({
  appt,
  onGo,
}: {
  appt: AppointmentDto;
  onGo: (t: TabId) => void;
}) {
  const toast = useToast();
  const KindIcon = appt.kind === "video" ? Video : appt.kind === "phone" ? Phone : MapPin;
  return (
    <motion.div
      {...rise}
      transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      className="hero-sheen relative overflow-hidden rounded-[30px] p-5 text-cream"
    >
      <div className="dot-grid pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <Chip tone="dark">
            <KindIcon size={11} />
            {appt.kind === "video" ? "Video visit" : appt.kind === "phone" ? "Phone call" : "In person"}
          </Chip>
          <Chip tone="dark" className="bg-leaf/25 text-[#9FEFD4]">
            in {until(appt.startsAt)}
          </Chip>
        </div>

        <div className="flex items-center gap-3.5">
          <div className="grid size-12 place-items-center rounded-full bg-white/10 text-[15px] font-semibold text-cream ring-1 ring-white/15">
            {appt.doctorName.replace(/^Dr\.\s*/, "").split(" ").slice(-2).map((w) => w[0]).join("")}
          </div>
          <div>
            <p className="font-display text-[22px] leading-tight italic">
              {appt.doctorName}
            </p>
            <p className="text-[12.5px] text-white/55">
              {appt.specialty} · {appt.reason}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-[26px] leading-none font-semibold tracking-tight">
              {dayLabel(appt.startsAt)}
              <span className="mx-1.5 text-white/30">·</span>
              {timeOf(appt.startsAt)}
            </p>
            <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-white/45">
              <MapPin size={11} /> {appt.location} · {appt.durationMin} min
            </p>
          </div>
        </div>

        <div className="mt-4 flex gap-2.5">
          {appt.kind === "video" ? (
            <button
              onClick={() => toast.push("Opening your secure video room…")}
              className="flex-1 rounded-full bg-cream py-2.5 text-[13.5px] font-semibold text-ink transition hover:bg-white active:scale-[0.98]"
            >
              Join visit
            </button>
          ) : (
            <button
              onClick={() => toast.push("Directions copied — safe travels")}
              className="flex-1 rounded-full bg-cream py-2.5 text-[13.5px] font-semibold text-ink transition hover:bg-white active:scale-[0.98]"
            >
              Get directions
            </button>
          )}
          <button
            onClick={() => onGo("schedule")}
            className="rounded-full border border-white/20 px-5 py-2.5 text-[13.5px] font-semibold text-cream/90 transition hover:bg-white/10"
          >
            Manage
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function VitalMiniCard({
  type,
  data,
}: {
  type: keyof BootstrapDto["vitals"];
  data: BootstrapDto;
}) {
  const meta = VITAL_META[type];
  const series = data.vitals[type];
  if (!series.length) return null;
  const last = series[series.length - 1];
  const prev = series[series.length - 2];
  const delta = last.value != null && prev?.value != null ? last.value - prev.value : 0;
  const points = series.slice(-12).map((v) => v.value ?? 0);

  return (
    <div className="w-[150px] shrink-0 snap-start rounded-3xl border border-line bg-card p-3.5">
      <p className="text-[11px] font-semibold tracking-wide text-ink-faint uppercase">
        {meta.label}
      </p>
      <p className="mt-1 font-display text-[24px] leading-none text-ink">
        {meta.dual
          ? `${Math.round(last.value ?? 0)}/${Math.round(last.value2 ?? 0)}`
          : (last.value ?? 0).toFixed(meta.decimals)}
        <span className="ml-1 font-sans text-[10px] font-medium text-ink-faint">
          {meta.unit}
        </span>
      </p>
      <div className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold">
        {Math.abs(delta) < 0.5 ? (
          <>
            <Minus size={11} className="text-ink-faint" />
            <span className="text-ink-faint">steady</span>
          </>
        ) : delta > 0 ? (
          <>
            <ArrowUpRight size={11} className="text-gold" />
            <span className="text-[#9C6417]">+{delta.toFixed(meta.decimals)}</span>
          </>
        ) : (
          <>
            <ArrowDownRight size={11} className="text-leaf" />
            <span className="text-moss">{delta.toFixed(meta.decimals)}</span>
          </>
        )}
      </div>
      <div className="mt-2">
        <Area points={points} accent={meta.accent} height={38} showDot={false} animate={false} />
      </div>
    </div>
  );
}

export default function Today({
  data,
  onGo,
  onOpenProfile,
}: {
  data: BootstrapDto;
  onGo: (t: TabId) => void;
  onOpenProfile: () => void;
}) {
  const now = new Date();
  const nextAppt = data.appointments.find(
    (a) => new Date(a.startsAt) > now && a.status !== "cancelled",
  );

  const todayDoses = data.doses
    .filter((d) => {
      const t = new Date(d.scheduledAt);
      return (
        t.getFullYear() === now.getFullYear() &&
        t.getMonth() === now.getMonth() &&
        t.getDate() === now.getDate()
      );
    })
    .sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt));

  const medById = new Map(data.medications.map((m) => [m.id, m]));
  const takenCount = todayDoses.filter((d) => d.status === "taken").length;
  const latestNote = [...data.messages].reverse().find((m) => m.sender === "care_team");

  return (
    <div className="space-y-6 px-5 pb-32">
      {/* header */}
      <motion.div {...rise} transition={{ duration: 0.45 }} className="flex items-start justify-between pt-2">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.16em] text-ink-faint uppercase">
            {format(now, "EEEE, MMMM d")}
          </p>
          <h1 className="mt-1 text-[30px] leading-tight font-semibold tracking-tight text-ink">
            {greeting()},{" "}
            <span className="font-display italic">{data.patient.preferredName}</span>
          </h1>
        </div>
        <button onClick={onOpenProfile} className="mt-1 transition active:scale-90" aria-label="Profile">
          <Avatar name={data.patient.name} size={44} className="ring-2 ring-leaf/20" />
        </button>
      </motion.div>

      {/* next appointment */}
      <motion.div {...rise} transition={{ duration: 0.5, delay: 0.06 }}>
        {nextAppt ? (
          <HeroCard appt={nextAppt} onGo={onGo} />
        ) : (
          <button
            onClick={() => onGo("schedule")}
            className="flex w-full items-center justify-between rounded-[28px] border border-dashed border-line bg-cream p-5 text-left transition hover:border-leaf/40"
          >
            <div>
              <p className="font-display text-lg text-ink italic">Nothing on the calendar</p>
              <p className="text-[13px] text-ink-soft">Book your next visit in seconds</p>
            </div>
            <span className="grid size-10 place-items-center rounded-full bg-ink text-cream">
              <CalendarDays size={17} />
            </span>
          </button>
        )}
      </motion.div>

      {/* today's meds */}
      <motion.section {...rise} transition={{ duration: 0.5, delay: 0.12 }} className="space-y-3">
        <SectionTitle
          title="Today's meds"
          action={
            <span className="text-[12px] font-semibold text-ink-soft">
              {takenCount} of {todayDoses.length} taken
            </span>
          }
        />
        <div className="h-1.25 overflow-hidden rounded-full bg-ink/[0.06]">
          <motion.div
            className="h-full rounded-full bg-leaf"
            initial={{ width: 0 }}
            animate={{
              width: `${todayDoses.length ? (takenCount / todayDoses.length) * 100 : 0}%`,
            }}
            transition={{ type: "spring", stiffness: 80, damping: 20 }}
          />
        </div>
        <div className="space-y-2">
          {todayDoses.map((d) => (
            <DoseRow key={`${d.medicationId}-${d.scheduledAt}`} dose={d} med={medById.get(d.medicationId)} />
          ))}
        </div>
      </motion.section>

      {/* vitals strip */}
      <motion.section {...rise} transition={{ duration: 0.5, delay: 0.18 }} className="space-y-3">
        <SectionTitle
          title="Latest vitals"
          action={
            <button
              onClick={() => onGo("health")}
              className="text-[12px] font-semibold text-moss"
            >
              See trends
            </button>
          }
        />
        <div className="app-scroll -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1">
          <VitalMiniCard type="heart_rate" data={data} />
          <VitalMiniCard type="blood_pressure" data={data} />
          <VitalMiniCard type="glucose" data={data} />
          <VitalMiniCard type="weight" data={data} />
        </div>
      </motion.section>

      {/* care note */}
      {latestNote && (
        <motion.button
          {...rise}
          transition={{ duration: 0.5, delay: 0.24 }}
          onClick={() => onGo("messages")}
          className="w-full rounded-[26px] border border-line bg-card p-4.5 text-left transition hover:border-leaf/30"
        >
          <div className="flex items-center gap-3">
            <Avatar name={latestNote.authorName} size={38} />
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-ink">
                {latestNote.authorName}
                <span className="ml-1.5 font-normal text-ink-faint">{latestNote.authorRole}</span>
              </p>
              <p className="truncate text-[13px] text-ink-soft">{latestNote.body}</p>
            </div>
            <span className="text-[11px] font-semibold text-moss">Reply</span>
          </div>
        </motion.button>
      )}

      {/* tip */}
      <motion.div
        {...rise}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex items-start gap-3 rounded-[26px] bg-leaf/[0.08] p-4.5 ring-1 ring-leaf/15"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-leaf/15 text-moss">
          <Sparkles size={16} />
        </span>
        <div>
          <p className="font-display text-[16px] leading-snug text-ink italic">
            “Two minutes of morning daylight helps anchor your circadian rhythm —
            and steadier sleep steadies blood pressure.”
          </p>
          <p className="mt-1.5 text-[11px] font-semibold tracking-wide text-ink-faint uppercase">
            Coach&apos;s note · curated for Maya
          </p>
        </div>
      </motion.div>
    </div>
  );
}
