"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Droplets,
  Gauge,
  HeartPulse,
  Minus,
  Plus,
  Scale,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { api } from "@/lib/api";
import type { BootstrapDto, VitalType } from "@/lib/types";
import { VITAL_META } from "@/lib/constants";
import { dayLabel } from "@/lib/format";
import AppSheet from "../app/Sheet";
import { useToast } from "../app/providers";
import { Chip, Field, inputCls } from "../app/ui";
import { Area, vitalStats } from "../app/charts";

const VITAL_ICONS: Record<VitalType, typeof HeartPulse> = {
  heart_rate: HeartPulse,
  blood_pressure: Activity,
  weight: Scale,
  glucose: Droplets,
  oxygen: Gauge,
};

const ORDER: VitalType[] = ["heart_rate", "blood_pressure", "weight", "glucose", "oxygen"];

function LogSheet({
  open,
  preset,
  onClose,
}: {
  open: boolean;
  preset: VitalType;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const toast = useToast();
  const [type, setType] = useState<VitalType>(preset);
  const [value, setValue] = useState("");
  const [value2, setValue2] = useState("");
  const [note, setNote] = useState("");

  const meta = VITAL_META[type];

  const mut = useMutation({
    mutationFn: () =>
      api.logVital({
        type,
        value: Number(value),
        value2: meta.dual ? Number(value2) : undefined,
        note: note.trim() || undefined,
      }),
    onSuccess: () => {
      toast.push("Reading saved to your log");
      qc.invalidateQueries({ queryKey: ["bootstrap"] });
      setValue("");
      setValue2("");
      setNote("");
      onClose();
    },
    onError: () => toast.push("Couldn't save that reading", "error"),
  });

  const ready = meta.dual ? Number(value) > 0 && Number(value2) > 0 : Number(value) > 0;

  return (
    <AppSheet open={open} onClose={onClose} title="Log a reading">
      <div className="space-y-5 pb-2">
        <div className="flex flex-wrap gap-2">
          {ORDER.map((t) => {
            const Icon = VITAL_ICONS[t];
            const active = type === t;
            return (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[12.5px] font-semibold transition ${
                  active
                    ? "border-ink bg-ink text-cream"
                    : "border-line bg-card text-ink-soft hover:border-ink/25"
                }`}
              >
                <Icon size={13} /> {VITAL_META[t].label}
              </button>
            );
          })}
        </div>

        {meta.dual ? (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Systolic">
              <input
                className={`${inputCls} text-center font-display text-2xl`}
                inputMode="numeric"
                placeholder="120"
                value={value}
                onChange={(e) => setValue(e.target.value.replace(/[^\d.]/g, ""))}
              />
            </Field>
            <Field label="Diastolic">
              <input
                className={`${inputCls} text-center font-display text-2xl`}
                inputMode="numeric"
                placeholder="80"
                value={value2}
                onChange={(e) => setValue2(e.target.value.replace(/[^\d.]/g, ""))}
              />
            </Field>
          </div>
        ) : (
          <Field label={`Value (${meta.unit})`}>
            <input
              className={`${inputCls} text-center font-display text-3xl`}
              inputMode="decimal"
              placeholder={type === "weight" ? "61.4" : type === "oxygen" ? "98" : "72"}
              value={value}
              onChange={(e) => setValue(e.target.value.replace(/[^\d.]/g, ""))}
            />
          </Field>
        )}

        <Field label="Note (optional)">
          <input
            className={inputCls}
            placeholder="e.g. After a morning walk"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={120}
          />
        </Field>

        <motion.button
          whileTap={{ scale: 0.98 }}
          disabled={!ready || mut.isPending}
          onClick={() => mut.mutate()}
          className="w-full rounded-full bg-leaf py-3.5 text-[15px] font-semibold text-white transition disabled:bg-ink/20"
        >
          {mut.isPending ? "Saving…" : "Save reading"}
        </motion.button>
        <p className="text-center text-[11.5px] text-ink-faint">
          Typical range for you: {meta.normal} {meta.unit}
        </p>
      </div>
    </AppSheet>
  );
}

function VitalCard({
  type,
  data,
  onLog,
  delay,
}: {
  type: VitalType;
  data: BootstrapDto;
  onLog: (t: VitalType) => void;
  delay: number;
}) {
  const meta = VITAL_META[type];
  const Icon = VITAL_ICONS[type];
  const series = data.vitals[type];
  if (series.length === 0) return null;

  const last = series[series.length - 1];
  const points = series.slice(-14).map((v) => v.value ?? 0);
  const stats = vitalStats(points);
  const half = Math.floor(points.length / 2);
  const recentAvg = points.slice(half).reduce((a, b) => a + b, 0) / Math.max(1, points.length - half);
  const priorAvg = points.slice(0, half).reduce((a, b) => a + b, 0) / Math.max(1, half);
  const trend = recentAvg - priorAvg;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      className="rounded-[28px] border border-line bg-card p-5"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className="grid size-9 place-items-center rounded-xl"
            style={{ background: `${meta.accent}1F`, color: meta.accent }}
          >
            <Icon size={17} />
          </span>
          <div>
            <p className="text-[14px] font-semibold text-ink">{meta.label}</p>
            <p className="text-[11px] text-ink-faint">last {series.length} days</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Chip tone="neutral">goal {meta.normal}</Chip>
          <button
            onClick={() => onLog(type)}
            className="grid size-8 place-items-center rounded-full bg-ink/[0.06] text-ink transition hover:bg-ink/10 active:scale-90"
            aria-label={`Log ${meta.label}`}
          >
            <Plus size={15} />
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-end justify-between">
        <p className="font-display text-[38px] leading-none text-ink">
          {meta.dual
            ? `${Math.round(last.value ?? 0)}/${Math.round(last.value2 ?? 0)}`
            : (last.value ?? 0).toFixed(meta.decimals)}
          <span className="ml-1.5 font-sans text-[12px] font-medium text-ink-faint">
            {meta.unit}
          </span>
        </p>
        <span
          className="flex items-center gap-1 text-[11.5px] font-semibold"
          style={{ color: Math.abs(trend) < 0.5 ? "#a8a294" : trend < 0 ? "#0E7A5F" : "#9C6417" }}
        >
          {Math.abs(trend) < 0.5 ? (
            <Minus size={12} />
          ) : trend < 0 ? (
            <TrendingDown size={12} />
          ) : (
            <TrendingUp size={12} />
          )}
          {Math.abs(trend) < 0.5
            ? "steady"
            : `${trend > 0 ? "+" : ""}${trend.toFixed(meta.decimals)} vs last week`}
        </span>
      </div>
      <p className="mt-1 text-[11.5px] text-ink-faint">
        {dayLabel(last.recordedAt)} · latest reading
      </p>

      <div className="mt-3">
        <Area points={points} accent={meta.accent} height={84} />
      </div>

      {stats && (
        <div className="mt-3 grid grid-cols-3 divide-x divide-line rounded-2xl bg-cream py-2.5">
          {[
            { l: "min", v: stats.min },
            { l: "avg", v: stats.avg },
            { l: "max", v: stats.max },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <p className="text-[10px] font-bold tracking-[0.14em] text-ink-faint uppercase">{s.l}</p>
              <p className="font-display text-[17px] text-ink">{s.v.toFixed(meta.decimals)}</p>
            </div>
          ))}
        </div>
      )}
    </motion.section>
  );
}

export default function Health({ data }: { data: BootstrapDto }) {
  const [logOpen, setLogOpen] = useState(false);
  const [preset, setPreset] = useState<VitalType>("heart_rate");

  const bpSeries = data.vitals.blood_pressure.map((v) => v.value ?? 0);
  const latestBp = bpSeries.at(-1) ?? 0;
  const bpAvg = bpSeries.length
    ? bpSeries.reduce((a, b) => a + b, 0) / bpSeries.length
    : 0;
  const bpDelta = Math.round(latestBp - bpAvg);
  const TrendIcon = bpDelta < 0 ? ArrowDownRight : ArrowUpRight;

  return (
    <div className="space-y-5 px-5 pb-32">
      <div className="flex items-end justify-between pt-2">
        <div>
          <h1 className="text-[30px] leading-tight font-semibold tracking-tight text-ink">
            <span className="font-display italic">Health</span>
          </h1>
          <p className="text-[13px] text-ink-soft">Your body&apos;s quiet signals</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            setPreset("heart_rate");
            setLogOpen(true);
          }}
          className="grid size-11 place-items-center rounded-full bg-ink text-cream shadow-lg transition hover:bg-black"
          aria-label="Log a reading"
        >
          <Plus size={20} />
        </motion.button>
      </div>

      {bpSeries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 rounded-[26px] bg-lilac/[0.09] p-4.5 ring-1 ring-lilac/20"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-lilac/20 text-lilac">
            <TrendIcon size={16} />
          </span>
          <div>
            <p className="font-display text-[16px] leading-snug text-ink italic">
              {bpDelta < 0
                ? `Systolic is ${Math.abs(bpDelta)} points under your 30-day average — the Lisinopril routine is working.`
                : bpDelta > 0
                  ? `Systolic is ${bpDelta} points above your 30-day average — worth mentioning at your next visit.`
                  : "Blood pressure is holding exactly at your 30-day average."}
            </p>
            <p className="mt-1 text-[11px] font-semibold tracking-wide text-ink-faint uppercase">
              Solace insight · auto-generated
            </p>
          </div>
        </motion.div>
      )}

      {ORDER.map((t, i) => (
        <VitalCard
          key={t}
          type={t}
          data={data}
          delay={0.05 * i}
          onLog={(vt) => {
            setPreset(vt);
            setLogOpen(true);
          }}
        />
      ))}

      <LogSheet
        key={`${preset}-${logOpen}`}
        open={logOpen}
        preset={preset}
        onClose={() => setLogOpen(false)}
      />
    </div>
  );
}
