"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarClock,
  Check,
  Moon,
  Pill,
  Plus,
  Sun,
  Sunrise,
  Wind,
  Droplets,
} from "lucide-react";
import { api } from "@/lib/api";
import type { BootstrapDto, DoseDto, MedicationDto } from "@/lib/types";
import { daysUntil, periodOf, prettyDate } from "@/lib/format";
import AppSheet from "../app/Sheet";
import { useToast } from "../app/providers";
import {
  ACCENTS,
  Chip,
  EmptyState,
  Field,
  ProgressRing,
  SectionTitle,
  Switch,
  WeekBars,
  inputCls,
} from "../app/ui";
import { DoseRow } from "./DoseRow";

const FORM_ICONS: Record<string, typeof Pill> = {
  tablet: Pill,
  capsule: Pill,
  inhaler: Wind,
  liquid: Droplets,
};

const PERIODS = [
  { id: "morning", label: "Morning", icon: Sunrise },
  { id: "afternoon", label: "Afternoon", icon: Sun },
  { id: "evening", label: "Evening", icon: Moon },
] as const;

function AddMedSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [form, setForm] = useState("tablet");
  const [times, setTimes] = useState<string[]>(["08:00"]);
  const [instructions, setInstructions] = useState("");

  const SCHEDULE_CHOICES = [
    { value: "08:00", label: "Morning" },
    { value: "13:00", label: "Midday" },
    { value: "19:30", label: "Evening" },
    { value: "22:00", label: "Bedtime" },
  ];

  const mut = useMutation({
    mutationFn: () =>
      api.addMedication({
        name: name.trim(),
        dosage: dosage.trim(),
        form,
        instructions: instructions.trim(),
        timesOfDay: times.sort(),
      }),
    onSuccess: (med) => {
      toast.push(`${med.name} added to your cabinet`);
      qc.invalidateQueries({ queryKey: ["bootstrap"] });
      onClose();
    },
    onError: () => toast.push("Couldn't add that medication", "error"),
  });

  const toggleTime = (t: string) =>
    setTimes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );

  return (
    <AppSheet open={open} onClose={onClose} title="Add a medication">
      <div className="space-y-5 pb-2">
        <div className="grid grid-cols-[1fr_110px] gap-3">
          <Field label="Name">
            <input
              className={inputCls}
              placeholder="e.g. Ibuprofen"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
            />
          </Field>
          <Field label="Dosage">
            <input
              className={inputCls}
              placeholder="200 mg"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              maxLength={20}
            />
          </Field>
        </div>

        <Field label="Form">
          <div className="flex gap-2">
            {(["tablet", "capsule", "liquid", "inhaler"] as const).map((f) => {
              const Icon = FORM_ICONS[f];
              const active = form === f;
              return (
                <button
                  key={f}
                  onClick={() => setForm(f)}
                  className={`flex flex-1 flex-col items-center gap-1 rounded-2xl border py-2.5 text-[11.5px] font-semibold capitalize transition ${
                    active
                      ? "border-ink bg-ink text-cream"
                      : "border-line bg-card text-ink-soft hover:border-ink/25"
                  }`}
                >
                  <Icon size={15} /> {f}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Schedule">
          <div className="flex flex-wrap gap-2">
            {SCHEDULE_CHOICES.map((s) => {
              const active = times.includes(s.value);
              return (
                <button
                  key={s.value}
                  onClick={() => toggleTime(s.value)}
                  className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-[13px] font-semibold transition ${
                    active
                      ? "border-leaf bg-leaf/10 text-moss"
                      : "border-line bg-card text-ink-soft hover:border-ink/25"
                  }`}
                >
                  {active && <Check size={13} strokeWidth={3} />}
                  {s.label} · {s.value}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-[11.5px] text-ink-faint">
            None selected = taken as needed (PRN).
          </p>
        </Field>

        <Field label="Instructions (optional)">
          <input
            className={inputCls}
            placeholder="e.g. Take with food"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            maxLength={120}
          />
        </Field>

        <motion.button
          whileTap={{ scale: 0.98 }}
          disabled={!name.trim() || !dosage.trim() || mut.isPending}
          onClick={() => mut.mutate()}
          className="w-full rounded-full bg-leaf py-3.5 text-[15px] font-semibold text-white transition disabled:bg-ink/20"
        >
          {mut.isPending ? "Adding…" : "Add to cabinet"}
        </motion.button>
      </div>
    </AppSheet>
  );
}

function CabinetCard({
  med,
  onToggle,
}: {
  med: MedicationDto;
  onToggle: (m: MedicationDto, v: boolean) => void;
}) {
  const accent = ACCENTS[med.accent] ?? ACCENTS.emerald;
  const Icon = FORM_ICONS[med.form] ?? Pill;
  const refillDays = daysUntil(med.refillBy);
  const refillSoon = refillDays <= 14;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-3xl border border-line bg-card p-4 ${!med.active ? "opacity-55" : ""}`}
    >
      <div className="flex items-start gap-3">
        <span
          className="grid size-11 shrink-0 place-items-center rounded-2xl"
          style={{ background: accent.soft, color: accent.text }}
        >
          <Icon size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-ink">
            {med.name} <span className="font-normal text-ink-soft">{med.dosage}</span>
          </p>
          <p className="mt-0.5 text-[12px] leading-snug text-ink-soft">{med.instructions}</p>
        </div>
        <Switch checked={med.active} onChange={(v) => onToggle(med, v)} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Chip tone={refillSoon ? "amber" : "neutral"}>
          <CalendarClock size={10} />
          Refill {prettyDate(med.refillBy)}
          {refillSoon && ` · ${Math.max(refillDays, 0)}d`}
        </Chip>
        <Chip tone="neutral">{med.prescribedBy}</Chip>
        {med.timesOfDay.length === 0 && <Chip tone="sky">As needed</Chip>}
      </div>
    </motion.div>
  );
}

export default function Meds({ data }: { data: BootstrapDto }) {
  const [addOpen, setAddOpen] = useState(false);
  const qc = useQueryClient();
  const toast = useToast();

  const toggleMut = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      api.patchMedication(id, { active }),
    onSuccess: (m) => {
      toast.push(m.active ? `${m.name} reactivated` : `${m.name} paused`);
      qc.invalidateQueries({ queryKey: ["bootstrap"] });
    },
    onError: () => toast.push("Couldn't update medication", "error"),
  });

  const now = new Date();
  const activeMeds = data.medications.filter((m) => m.active);
  const medById = new Map(data.medications.map((m) => [m.id, m]));

  const todayDoses = data.doses
    .filter((d) => {
      const t = new Date(d.scheduledAt);
      return (
        medById.get(d.medicationId)?.active &&
        t.getFullYear() === now.getFullYear() &&
        t.getMonth() === now.getMonth() &&
        t.getDate() === now.getDate()
      );
    })
    .sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt));

  const grouped = PERIODS.map((p) => ({
    ...p,
    doses: todayDoses.filter((d) => periodOf(d.scheduledAt) === p.id),
  })).filter((g) => g.doses.length > 0);

  return (
    <div className="space-y-6 px-5 pb-32">
      <div className="flex items-end justify-between pt-2">
        <div>
          <h1 className="text-[30px] leading-tight font-semibold tracking-tight text-ink">
            <span className="font-display italic">Meds</span>
          </h1>
          <p className="text-[13px] text-ink-soft">
            {activeMeds.length} active · {data.medications.length - activeMeds.length} paused
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setAddOpen(true)}
          className="grid size-11 place-items-center rounded-full bg-ink text-cream shadow-lg transition hover:bg-black"
          aria-label="Add medication"
        >
          <Plus size={20} />
        </motion.button>
      </div>

      {/* adherence */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-5 rounded-[28px] border border-line bg-card p-5"
      >
        <ProgressRing value={data.adherence7} size={92}>
          <span className="font-display text-[22px] text-ink">
            {Math.round(data.adherence7 * 100)}
            <span className="text-[12px] text-ink-faint">%</span>
          </span>
        </ProgressRing>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-ink">7-day adherence</p>
          <p className="mb-3 text-[12px] leading-snug text-ink-soft">
            {data.adherence7 >= 0.9
              ? "Beautifully steady — your future self says thanks."
              : data.adherence7 >= 0.7
                ? "Solid. A gentle nudge keeps the streak alive."
                : "Let's rebuild the habit — one dose at a time."}
          </p>
          <WeekBars days={data.weekDoses} />
        </div>
      </motion.section>

      {/* today's schedule */}
      <section className="space-y-3">
        <SectionTitle title="Today's schedule" />
        {grouped.length === 0 && (
          <EmptyState
            icon={<Check size={20} />}
            title="Nothing scheduled today"
            body="New medications added with a schedule will appear here automatically."
          />
        )}
        {grouped.map((g) => {
          const Icon = g.icon;
          const taken = g.doses.filter((d) => d.status === "taken").length;
          return (
            <div key={g.id} className="space-y-2">
              <div className="flex items-center justify-between px-1 pt-2">
                <span className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-soft">
                  <Icon size={13} className="text-ink-faint" /> {g.label}
                </span>
                <span className="text-[11px] font-semibold text-ink-faint">
                  {taken}/{g.doses.length}
                </span>
              </div>
              {g.doses.map((d: DoseDto) => (
                <DoseRow
                  key={`${d.medicationId}-${d.scheduledAt}`}
                  dose={d}
                  med={medById.get(d.medicationId)}
                />
              ))}
            </div>
          );
        })}
      </section>

      {/* cabinet */}
      <section className="space-y-3">
        <SectionTitle title="Your cabinet" />
        <AnimatePresence>
          {data.medications.map((m) => (
            <CabinetCard key={m.id} med={m} onToggle={(med, v) => toggleMut.mutate({ id: med.id, active: v })} />
          ))}
        </AnimatePresence>
      </section>

      <AddMedSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
