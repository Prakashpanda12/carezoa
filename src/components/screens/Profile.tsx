"use client";

import { useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Building2,
  Check,
  ClipboardList,
  Copy,
  CreditCard,
  Droplet,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldAlert,
  Stethoscope,
  TriangleAlert,
} from "lucide-react";
import { api } from "@/lib/api";
import type { PatientDto } from "@/lib/types";
import AppSheet from "../app/Sheet";
import { useToast } from "../app/providers";
import { Avatar, inputCls } from "../app/ui";

function Row({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-ink/[0.05] text-ink-soft">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10.5px] font-bold tracking-[0.12em] text-ink-faint uppercase">
          {label}
        </p>
        <div className="mt-0.5 text-[14px] text-ink">{children}</div>
      </div>
    </div>
  );
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-[26px] border border-line bg-card px-4 py-1.5 ${className}`}>
      {children}
    </div>
  );
}

export default function Profile({
  patient,
  open,
  onClose,
}: {
  patient: PatientDto;
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    phone: patient.phone,
    email: patient.email,
    address: patient.address,
    pharmacy: patient.pharmacy,
    emergencyContactName: patient.emergencyContactName,
    emergencyContactPhone: patient.emergencyContactPhone,
  });

  const saveMut = useMutation({
    mutationFn: () => api.patchPatient(form),
    onSuccess: () => {
      toast.push("Profile updated");
      qc.invalidateQueries({ queryKey: ["bootstrap"] });
      setEditing(false);
    },
    onError: () => toast.push("Couldn't save changes", "error"),
  });

  const copyMemberId = async () => {
    try {
      await navigator.clipboard.writeText(patient.insuranceMemberId);
      toast.push("Member ID copied");
    } catch {
      toast.push("Copy not available here", "error");
    }
  };

  const age =
    new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();

  return (
    <AppSheet open={open} onClose={onClose} title="Profile" full>
      <div className="space-y-4 pb-4">
        {/* identity */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="hero-sheen relative overflow-hidden rounded-[28px] p-5 text-cream"
        >
          <div className="dot-grid pointer-events-none absolute inset-0 opacity-40" />
          <div className="relative flex items-center gap-4">
            <div className="grid size-16 place-items-center rounded-full bg-white/10 text-[20px] font-semibold ring-1 ring-white/20">
              {patient.name.split(" ").map((w) => w[0]).join("")}
            </div>
            <div>
              <p className="font-display text-[24px] leading-tight italic">{patient.name}</p>
              <p className="text-[12.5px] text-white/55">
                {patient.pronouns} · {age} yrs · {patient.bloodType}
              </p>
              <p className="mt-1 inline-block rounded-full bg-white/10 px-2.5 py-0.5 text-[10.5px] font-semibold tracking-widest text-white/70">
                {patient.mrn}
              </p>
            </div>
          </div>
        </motion.div>

        {/* conditions & allergies */}
        <Card>
          <Row icon={<ClipboardList size={15} />} label="Conditions">
            <div className="mt-1 flex flex-wrap gap-1.5">
              {patient.conditions.map((c) => (
                <span key={c} className="rounded-full bg-ink/[0.05] px-2.5 py-1 text-[11.5px] font-medium text-ink-soft">
                  {c}
                </span>
              ))}
            </div>
          </Row>
          <div className="fade-line h-px" />
          <Row icon={<TriangleAlert size={15} />} label="Allergies">
            <div className="mt-1 flex flex-wrap gap-1.5">
              {patient.allergies.map((a) => (
                <span key={a} className="rounded-full bg-ember/10 px-2.5 py-1 text-[11.5px] font-semibold text-[#B93A46]">
                  {a}
                </span>
              ))}
            </div>
          </Row>
          <div className="fade-line h-px" />
          <Row icon={<Stethoscope size={15} />} label="Primary physician">
            {patient.primaryPhysician}
          </Row>
          <div className="fade-line h-px" />
          <Row icon={<Droplet size={15} />} label="Blood type">
            {patient.bloodType}
          </Row>
        </Card>

        {/* insurance */}
        <div className="hero-sheen relative overflow-hidden rounded-[26px] p-4.5 text-cream">
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] text-white/50 uppercase">
                <CreditCard size={13} /> Insurance
              </span>
              <span className="rounded-full bg-leaf/25 px-2.5 py-0.5 text-[10px] font-bold text-[#9FEFD4]">
                ACTIVE
              </span>
            </div>
            <p className="mt-2 font-display text-[19px] italic">{patient.insuranceProvider}</p>
            <p className="text-[12px] text-white/55">{patient.insurancePlan}</p>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <p className="text-[10px] tracking-[0.14em] text-white/40 uppercase">Member ID</p>
                <p className="font-mono text-[14px] tracking-wider text-white/90">
                  {patient.insuranceMemberId}
                </p>
              </div>
              <button
                onClick={copyMemberId}
                className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold transition hover:bg-white/20"
              >
                <Copy size={11} /> Copy
              </button>
            </div>
            <p className="mt-1.5 text-[10.5px] text-white/40">Group {patient.insuranceGroup}</p>
          </div>
        </div>

        {/* contact */}
        <Card>
          <div className="flex items-center justify-between pt-3">
            <p className="text-[11px] font-bold tracking-[0.12em] text-ink-faint uppercase">
              Contact &amp; care
            </p>
            <button
              onClick={() => (editing ? saveMut.mutate() : setEditing(true))}
              disabled={saveMut.isPending}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition ${
                editing ? "bg-leaf text-white" : "bg-ink/[0.06] text-ink hover:bg-ink/10"
              }`}
            >
              {editing ? (
                <>
                  <Check size={13} strokeWidth={3} /> {saveMut.isPending ? "Saving…" : "Save"}
                </>
              ) : (
                <>
                  <Pencil size={12} /> Edit
                </>
              )}
            </button>
          </div>
          {editing ? (
            <div className="space-y-3 py-3">
              {(
                [
                  ["Phone", "phone"],
                  ["Email", "email"],
                  ["Address", "address"],
                  ["Pharmacy", "pharmacy"],
                  ["Emergency contact", "emergencyContactName"],
                  ["Emergency phone", "emergencyContactPhone"],
                ] as const
              ).map(([label, key]) => (
                <label key={key} className="block">
                  <span className="mb-1 block text-[10.5px] font-bold tracking-[0.1em] text-ink-faint uppercase">
                    {label}
                  </span>
                  <input
                    className={inputCls}
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  />
                </label>
              ))}
              <button
                onClick={() => {
                  setEditing(false);
                  setForm({
                    phone: patient.phone,
                    email: patient.email,
                    address: patient.address,
                    pharmacy: patient.pharmacy,
                    emergencyContactName: patient.emergencyContactName,
                    emergencyContactPhone: patient.emergencyContactPhone,
                  });
                }}
                className="text-[12.5px] font-semibold text-ink-soft underline underline-offset-2"
              >
                Discard changes
              </button>
            </div>
          ) : (
            <>
              <Row icon={<Phone size={15} />} label="Phone">{patient.phone}</Row>
              <div className="fade-line h-px" />
              <Row icon={<Mail size={15} />} label="Email">{patient.email}</Row>
              <div className="fade-line h-px" />
              <Row icon={<MapPin size={15} />} label="Address">{patient.address}</Row>
              <div className="fade-line h-px" />
              <Row icon={<Building2 size={15} />} label="Pharmacy">{patient.pharmacy}</Row>
              <div className="fade-line h-px" />
              <Row icon={<ShieldAlert size={15} />} label="Emergency contact">
                {patient.emergencyContactName} · {patient.emergencyContactPhone}
              </Row>
            </>
          )}
        </Card>

        <p className="pb-6 text-center text-[11px] text-ink-faint">
          Solace v1.0 · your record lives in PostgreSQL, served fresh over the API
        </p>
      </div>
    </AppSheet>
  );
}
