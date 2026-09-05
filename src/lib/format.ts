import { differenceInMinutes, format, isToday, isTomorrow } from "date-fns";

export const timeOf = (iso: string) => format(new Date(iso), "h:mm a");

export function dayLabel(iso: string) {
  const d = new Date(iso);
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  return format(d, "EEE, MMM d");
}

/** Compact countdown like "2d 4h" / "3h 12m" / "45m" / "now". */
export function until(iso: string, from = new Date()) {
  const mins = differenceInMinutes(new Date(iso), from);
  if (mins <= 0) return "now";
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function greeting(d = new Date()) {
  const h = d.getHours();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export type DayPeriod = "morning" | "afternoon" | "evening";

export function periodOf(iso: string): DayPeriod {
  const h = new Date(iso).getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

export const prettyDate = (iso: string) => format(new Date(iso), "MMM d, yyyy");

export function daysUntil(dateYmd: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateYmd + "T00:00:00");
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}
