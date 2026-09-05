"use client";

import { useId, type ReactNode } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";

export const ACCENTS: Record<string, { hex: string; soft: string; text: string }> = {
  emerald: { hex: "#16A37B", soft: "rgba(22,163,123,0.12)", text: "#0E7A5F" },
  amber: { hex: "#E9A13B", soft: "rgba(233,161,59,0.14)", text: "#9C6417" },
  sky: { hex: "#4A8FD9", soft: "rgba(74,143,217,0.13)", text: "#2F66A8" },
  rose: { hex: "#E85D6A", soft: "rgba(232,93,106,0.12)", text: "#B93A46" },
  lilac: { hex: "#7C6CE8", soft: "rgba(124,108,232,0.13)", text: "#5A48C8" },
};

const AVATAR_TONES = [
  { bg: "rgba(22,163,123,0.16)", fg: "#0E7A5F" },
  { bg: "rgba(233,161,59,0.2)", fg: "#9C6417" },
  { bg: "rgba(74,143,217,0.16)", fg: "#2F66A8" },
  { bg: "rgba(232,93,106,0.15)", fg: "#B93A46" },
  { bg: "rgba(124,108,232,0.16)", fg: "#5A48C8" },
];

export function initials(name: string) {
  return name
    .replace(/^Dr\.\s*/, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function Avatar({
  name,
  size = 44,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const tone =
    AVATAR_TONES[
      Math.abs([...name].reduce((a, c) => a + c.charCodeAt(0), 0)) %
        AVATAR_TONES.length
    ];
  return (
    <div
      className={clsx("grid shrink-0 place-items-center rounded-full font-semibold", className)}
      style={{
        width: size,
        height: size,
        background: tone.bg,
        color: tone.fg,
        fontSize: size * 0.36,
      }}
    >
      {initials(name)}
    </div>
  );
}

export function Chip({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "moss" | "amber" | "coral" | "sky" | "dark";
  className?: string;
}) {
  const tones: Record<string, string> = {
    neutral: "bg-ink/[0.06] text-ink-soft",
    moss: "bg-leaf/15 text-moss",
    amber: "bg-gold/20 text-[#9C6417]",
    coral: "bg-ember/12 text-[#B93A46]",
    sky: "bg-sky/15 text-[#2F66A8]",
    dark: "bg-white/10 text-white/85",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Segmented({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  const id = useId();
  return (
    <div className="flex rounded-full bg-ink/[0.05] p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className="relative flex-1 rounded-full px-4 py-1.5 text-[13px] font-semibold"
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-full bg-card shadow-sm ring-1 ring-line"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
              />
            )}
            <span className={clsx("relative z-10", active ? "text-ink" : "text-ink-faint")}>
              {o.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function ProgressRing({
  value,
  size = 84,
  stroke = 7,
  accent = "#16A37B",
  track = "rgba(25,22,17,0.08)",
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  accent?: string;
  track?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={accent}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - clamped) }}
          transition={{ type: "spring", stiffness: 60, damping: 18 }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

export function WeekBars({
  days,
}: {
  days: { date: string; taken: number; total: number }[];
}) {
  const labels = ["S", "M", "T", "W", "T", "F", "S"];
  return (
    <div className="flex items-end justify-between gap-2">
      {days.map((d) => {
        const frac = d.total === 0 ? 1 : d.taken / d.total;
        const dayIdx = new Date(d.date + "T00:00:00").getDay();
        return (
          <div key={d.date} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="relative h-14 w-full max-w-7 overflow-hidden rounded-full bg-ink/[0.06]">
              <motion.div
                className="absolute inset-x-0 bottom-0 rounded-full bg-leaf"
                initial={{ height: 0 }}
                animate={{ height: `${frac * 100}%` }}
                transition={{ type: "spring", stiffness: 80, damping: 20 }}
                style={{ opacity: frac === 1 ? 1 : 0.45 + frac * 0.4 }}
              />
            </div>
            <span className="text-[10px] font-semibold text-ink-faint">{labels[dayIdx]}</span>
          </div>
        );
      })}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={clsx(
        "relative h-7 w-12 rounded-full transition-colors",
        checked ? "bg-leaf" : "bg-ink/15",
      )}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 550, damping: 32 }}
        className={clsx(
          "absolute top-0.5 size-6 rounded-full bg-white shadow",
          checked ? "right-0.5" : "left-0.5",
        )}
      />
    </button>
  );
}

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={clsx("block", className)}>
      <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.08em] text-ink-faint uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

export const inputCls =
  "w-full rounded-2xl border border-line bg-card px-4 py-3 text-[15px] text-ink placeholder:text-ink-faint focus:border-leaf focus:ring-2 focus:ring-leaf/25 transition";

export function EmptyState({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-line bg-cream px-6 py-10 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-ink/[0.05] text-ink-soft">
        {icon}
      </span>
      <p className="font-display text-lg text-ink italic">{title}</p>
      <p className="max-w-56 text-[13px] leading-relaxed text-ink-soft">{body}</p>
    </div>
  );
}

export function SectionTitle({
  title,
  action,
  className,
}: {
  title: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("flex items-end justify-between px-1", className)}>
      <h3 className="text-[13px] font-semibold tracking-[0.1em] text-ink-faint uppercase">
        {title}
      </h3>
      {action}
    </div>
  );
}
