"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Check, Clock, RotateCcw } from "lucide-react";
import { api } from "@/lib/api";
import { timeOf } from "@/lib/format";
import type { BootstrapDto, DoseDto, MedicationDto } from "@/lib/types";
import { ACCENTS } from "../app/ui";
import { useToast } from "../app/providers";

export function DoseRow({ dose, med }: { dose: DoseDto; med?: MedicationDto }) {
  const qc = useQueryClient();
  const toast = useToast();

  const mut = useMutation({
    mutationFn: api.logDose,
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ["bootstrap"] });
      const prev = qc.getQueryData<BootstrapDto>(["bootstrap"]);
      qc.setQueryData<BootstrapDto>(["bootstrap"], (old) =>
        old
          ? {
              ...old,
              doses: old.doses.map((d) =>
                d.medicationId === vars.medicationId &&
                d.scheduledAt === vars.scheduledAt
                  ? {
                      ...d,
                      status: vars.action,
                      takenAt:
                        vars.action === "taken" ? new Date().toISOString() : null,
                    }
                  : d,
              ),
            }
          : old,
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["bootstrap"], ctx.prev);
      toast.push("Couldn't update that dose", "error");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["bootstrap"] }),
  });

  const accent = ACCENTS[med?.accent ?? "emerald"];
  const name = med ? `${med.name} ${med.dosage}` : "Medication";
  const taken = dose.status === "taken";
  const missed = dose.status === "missed";

  return (
    <motion.div
      layout
      className={`flex items-center gap-3 rounded-2xl border p-3 transition-colors ${
        taken
          ? "border-transparent bg-ink/[0.035]"
          : missed
            ? "border-gold/40 bg-gold/[0.07]"
            : "border-line bg-card"
      }`}
    >
      <span
        className="h-9 w-1.25 shrink-0 rounded-full"
        style={{ background: taken ? "rgba(25,22,17,0.15)" : accent.hex }}
      />
      <div className="min-w-0 flex-1">
        <p
          className={`text-[14px] leading-tight font-semibold ${
            taken ? "text-ink-faint line-through decoration-ink-faint/50" : "text-ink"
          }`}
        >
          {name}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-[12px] text-ink-faint">
          <Clock size={11} />
          {timeOf(dose.scheduledAt)}
          {missed && <span className="font-semibold text-[#9C6417]">· missed</span>}
          {taken && dose.takenAt && <span>· taken {timeOf(dose.takenAt)}</span>}
          {dose.status === "skipped" && <span>· skipped</span>}
        </p>
      </div>

      {taken ? (
        <button
          onClick={() =>
            mut.mutate({
              medicationId: dose.medicationId,
              scheduledAt: dose.scheduledAt,
              action: "scheduled",
            })
          }
          title="Undo"
          className="grid size-9 place-items-center rounded-full bg-leaf text-white transition active:scale-90"
        >
          <Check size={16} strokeWidth={3} />
        </button>
      ) : dose.status === "skipped" ? (
        <button
          onClick={() =>
            mut.mutate({
              medicationId: dose.medicationId,
              scheduledAt: dose.scheduledAt,
              action: "scheduled",
            })
          }
          className="grid size-9 place-items-center rounded-full bg-ink/10 text-ink-soft transition active:scale-90"
          title="Reschedule"
        >
          <RotateCcw size={15} />
        </button>
      ) : (
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() =>
            mut.mutate({
              medicationId: dose.medicationId,
              scheduledAt: dose.scheduledAt,
              action: "taken",
            })
          }
          disabled={mut.isPending}
          className={`rounded-full px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition disabled:opacity-60 ${
            missed ? "bg-gold" : "bg-ink hover:bg-black"
          }`}
        >
          {missed ? "Take now" : "Take"}
        </motion.button>
      )}
    </motion.div>
  );
}
