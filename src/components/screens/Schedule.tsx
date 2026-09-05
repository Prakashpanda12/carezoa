"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { addDays, format } from "date-fns";
import {
  CalendarPlus,
  Check,
  Clock,
  MapPin,
  Phone,
  Plus,
  RotateCcw,
  Video,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import type { AppointmentDto, BootstrapDto } from "@/lib/types";
import { DOCTORS, TIME_SLOTS } from "@/lib/constants";
import { timeOf } from "@/lib/format";
import AppSheet from "../app/Sheet";
import { useToast } from "../app/providers";
import { Chip, EmptyState, Field, Segmented, inputCls } from "../app/ui";

const KIND_OPTS = [
  { value: "in_person", label: "In person", icon: MapPin },
  { value: "video", label: "Video", icon: Video },
  { value: "phone", label: "Phone", icon: Phone },
] as const;

interface Prefill {
  doctorName?: string;
  specialty?: string;
  reason?: string;
  rescheduleOf?: number;
}

function BookingSheet({
  open,
  prefill,
  onClose,
}: {
  open: boolean;
  prefill: Prefill | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const toast = useToast();
  const [doctor, setDoctor] = useState<string | null>(prefill?.doctorName ?? null);
  const [kind, setKind] = useState<AppointmentDto["kind"]>("video");
  const [dayIdx, setDayIdx] = useState<number | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [reason, setReason] = useState(prefill?.reason ?? "");

  const days = useMemo(
    () => Array.from({ length: 14 }, (_, i) => addDays(new Date(), i + 1)),
    [],
  );

  const mut = useMutation({
    mutationFn: async () => {
      if (prefill?.rescheduleOf) {
        await api.patchAppointment(prefill.rescheduleOf, "cancel");
      }
      const doc = DOCTORS.find((d) => d.name === doctor)!;
      const d = new Date(days[dayIdx!]);
      const [h, m] = slot!.split(":").map(Number);
      d.setHours(h, m, 0, 0);
      return api.createAppointment({
        doctorName: doc.name,
        specialty: doc.specialty,
        kind,
        reason: reason.trim(),
        startsAt: d.toISOString(),
        durationMin: 30,
      });
    },
    onSuccess: () => {
      toast.push(
        prefill?.rescheduleOf
          ? "Visit rescheduled — pending confirmation"
          : "Request sent — we'll confirm shortly",
      );
      qc.invalidateQueries({ queryKey: ["bootstrap"] });
      onClose();
    },
    onError: () => toast.push("Couldn't book that visit", "error"),
  });

  const ready = doctor && dayIdx !== null && slot && reason.trim().length > 1;

  return (
    <AppSheet open={open} onClose={onClose} title={prefill?.rescheduleOf ? "Reschedule visit" : "Book a visit"}>
      <div className="space-y-5 pb-2">
        <Field label="Who would you like to see?">
          <div className="grid gap-2">
            {DOCTORS.map((d) => {
              const active = doctor === d.name;
              return (
                <button
                  key={d.name}
                  onClick={() => setDoctor(d.name)}
                  className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                    active
                      ? "border-leaf bg-leaf/[0.07] ring-2 ring-leaf/25"
                      : "border-line bg-card hover:border-ink/20"
                  }`}
                >
                  <span>
                    <span className="block text-[14px] font-semibold text-ink">{d.name}</span>
                    <span className="block text-[12px] text-ink-soft">{d.specialty}</span>
                  </span>
                  {active && (
                    <span className="grid size-6 place-items-center rounded-full bg-leaf text-white">
                      <Check size={13} strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Visit type">
          <div className="flex gap-2">
            {KIND_OPTS.map((k) => {
              const active = kind === k.value;
              const Icon = k.icon;
              return (
                <button
                  key={k.value}
                  onClick={() => setKind(k.value)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-2xl border py-2.5 text-[13px] font-semibold transition ${
                    active
                      ? "border-ink bg-ink text-cream"
                      : "border-line bg-card text-ink-soft hover:border-ink/25"
                  }`}
                >
                  <Icon size={14} /> {k.label}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Pick a day">
          <div className="app-scroll -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
            {days.map((d, i) => {
              const active = dayIdx === i;
              return (
                <button
                  key={d.toISOString()}
                  onClick={() => setDayIdx(i)}
                  className={`flex w-14 shrink-0 flex-col items-center rounded-2xl border py-2.5 transition ${
                    active
                      ? "border-ink bg-ink text-cream"
                      : "border-line bg-card text-ink-soft hover:border-ink/25"
                  }`}
                >
                  <span className="text-[10px] font-semibold uppercase">{format(d, "EEE")}</span>
                  <span className="font-display text-[19px] leading-6">{format(d, "d")}</span>
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Pick a time">
          <div className="grid grid-cols-4 gap-2">
            {TIME_SLOTS.map((t) => {
              const active = slot === t;
              return (
                <button
                  key={t}
                  onClick={() => setSlot(t)}
                  className={`rounded-xl border py-2 text-[13px] font-semibold transition ${
                    active
                      ? "border-ink bg-ink text-cream"
                      : "border-line bg-card text-ink-soft hover:border-ink/25"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="What's it about?">
          <input
            className={inputCls}
            placeholder="e.g. Follow-up on blood pressure"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={120}
          />
        </Field>

        <motion.button
          whileTap={{ scale: 0.98 }}
          disabled={!ready || mut.isPending}
          onClick={() => mut.mutate()}
          className="w-full rounded-full bg-leaf py-3.5 text-[15px] font-semibold text-white shadow-[0_10px_30px_-10px_rgba(22,163,123,0.6)] transition disabled:bg-ink/20 disabled:shadow-none"
        >
          {mut.isPending ? "Sending…" : prefill?.rescheduleOf ? "Confirm new time" : "Request appointment"}
        </motion.button>
        <p className="pb-1 text-center text-[11.5px] text-ink-faint">
          Requests are confirmed by the clinic within a few hours.
        </p>
      </div>
    </AppSheet>
  );
}

function AppointmentCard({
  appt,
  onAction,
  onReschedule,
  onBookAgain,
  mutating,
}: {
  appt: AppointmentDto;
  onAction: (id: number, action: "cancel" | "confirm") => void;
  onReschedule: (a: AppointmentDto) => void;
  onBookAgain: (a: AppointmentDto) => void;
  mutating: boolean;
}) {
  const d = new Date(appt.startsAt);
  const future = d > new Date();
  const cancelled = appt.status === "cancelled";
  const KindIcon = appt.kind === "video" ? Video : appt.kind === "phone" ? Phone : MapPin;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-3xl border border-line bg-card p-4 ${cancelled ? "opacity-55" : ""}`}
    >
      <div className="flex gap-3.5">
        <div className="flex w-13 shrink-0 flex-col items-center rounded-2xl border border-line bg-cream py-2">
          <span className="text-[10px] font-bold tracking-wide text-ink-faint uppercase">
            {format(d, "MMM")}
          </span>
          <span className="font-display text-[22px] leading-7 text-ink">{format(d, "d")}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-ink">{appt.reason}</p>
          <p className="text-[12.5px] text-ink-soft">
            {appt.doctorName} · {appt.specialty}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Chip tone="neutral">
              <Clock size={10} /> {timeOf(appt.startsAt)}
            </Chip>
            <Chip tone="neutral">
              <KindIcon size={10} />
              {appt.kind === "video" ? "Video" : appt.kind === "phone" ? "Phone" : "In person"}
            </Chip>
            {appt.status === "confirmed" && <Chip tone="moss">Confirmed</Chip>}
            {appt.status === "pending" && <Chip tone="amber">Pending</Chip>}
            {cancelled && <Chip tone="coral">Cancelled</Chip>}
          </div>
          {appt.notes && (
            <p className="mt-2 font-display text-[13.5px] leading-snug text-ink-soft italic">
              “{appt.notes}”
            </p>
          )}
        </div>
      </div>

      {!cancelled && (
        <div className="mt-3 flex gap-2 border-t border-line/70 pt-3">
          {future && appt.status === "pending" && (
            <button
              disabled={mutating}
              onClick={() => onAction(appt.id, "confirm")}
              className="flex-1 rounded-full bg-leaf py-2 text-[12.5px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-50"
            >
              Confirm
            </button>
          )}
          {future && appt.status === "confirmed" && (
            <button
              disabled={mutating}
              onClick={() => onReschedule(appt)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-ink/[0.06] py-2 text-[12.5px] font-semibold text-ink transition hover:bg-ink/10 active:scale-[0.98]"
            >
              <RotateCcw size={12} /> Reschedule
            </button>
          )}
          {future && (
            <button
              disabled={mutating}
              onClick={() => onAction(appt.id, "cancel")}
              className="flex items-center justify-center gap-1 rounded-full px-4 py-2 text-[12.5px] font-semibold text-ember transition hover:bg-ember/10"
            >
              <X size={12} /> Cancel
            </button>
          )}
          {!future && (
            <button
              onClick={() => onBookAgain(appt)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-ink/[0.06] py-2 text-[12.5px] font-semibold text-ink transition hover:bg-ink/10"
            >
              <CalendarPlus size={12} /> Book again
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function Schedule({ data }: { data: BootstrapDto }) {
  const [seg, setSeg] = useState("upcoming");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [prefill, setPrefill] = useState<Prefill | null>(null);
  const qc = useQueryClient();
  const toast = useToast();

  const actionMut = useMutation({
    mutationFn: ({ id, action }: { id: number; action: "cancel" | "confirm" }) =>
      api.patchAppointment(id, action),
    onSuccess: (_d, v) => {
      toast.push(v.action === "cancel" ? "Appointment cancelled" : "Appointment confirmed");
      qc.invalidateQueries({ queryKey: ["bootstrap"] });
    },
    onError: () => toast.push("Something went wrong", "error"),
  });

  const now = new Date();
  const upcoming = data.appointments.filter((a) => new Date(a.startsAt) >= now);
  const past = data.appointments
    .filter((a) => new Date(a.startsAt) < now)
    .sort((a, b) => +new Date(b.startsAt) - +new Date(a.startsAt));
  const list = seg === "upcoming" ? upcoming : past;

  const openBooking = (p: Prefill | null) => {
    setPrefill(p);
    setSheetOpen(true);
  };

  return (
    <div className="space-y-5 px-5 pb-32">
      <div className="flex items-end justify-between pt-2">
        <div>
          <h1 className="text-[30px] leading-tight font-semibold tracking-tight text-ink">
            <span className="font-display italic">Schedule</span>
          </h1>
          <p className="text-[13px] text-ink-soft">
            {upcoming.filter((a) => a.status !== "cancelled").length} upcoming visits
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => openBooking(null)}
          className="grid size-11 place-items-center rounded-full bg-ink text-cream shadow-lg transition hover:bg-black"
          aria-label="Book a visit"
        >
          <Plus size={20} />
        </motion.button>
      </div>

      <Segmented
        options={[
          { value: "upcoming", label: "Upcoming" },
          { value: "past", label: "Past" },
        ]}
        value={seg}
        onChange={setSeg}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={seg}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="space-y-3"
        >
          {list.length === 0 && (
            <EmptyState
              icon={<CalendarPlus size={20} />}
              title={seg === "upcoming" ? "All clear" : "No past visits"}
              body={
                seg === "upcoming"
                  ? "You have nothing scheduled. Tap the plus button to book your next visit."
                  : "Your visit history will appear here."
              }
            />
          )}
          {list.map((a) => (
            <AppointmentCard
              key={a.id}
              appt={a}
              mutating={actionMut.isPending}
              onAction={(id, action) => actionMut.mutate({ id, action })}
              onReschedule={(appt) =>
                openBooking({
                  doctorName: appt.doctorName,
                  reason: appt.reason,
                  rescheduleOf: appt.id,
                })
              }
              onBookAgain={(appt) =>
                openBooking({ doctorName: appt.doctorName, reason: appt.reason })
              }
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {prefill !== undefined && (
        <BookingSheet
          key={`${prefill?.rescheduleOf ?? "new"}-${sheetOpen}`}
          open={sheetOpen}
          prefill={prefill}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </div>
  );
}
