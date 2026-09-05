import { db } from "@/db";
import {
  appointments,
  doses,
  medications,
  messages,
  patients,
  vitals,
  type AppointmentRow,
  type DoseRow,
  type MedicationRow,
  type MessageRow,
  type PatientRow,
  type VitalRow,
} from "@/db/schema";
import type {
  AppointmentDto,
  BootstrapDto,
  DoseDto,
  MedicationDto,
  MessageDto,
  PatientDto,
  VitalPointDto,
  VitalType,
} from "@/lib/types";
import { and, asc, desc, gte, lt, lte } from "drizzle-orm";

const DAY = 86_400_000;

export function toPatient(r: PatientRow): PatientDto {
  return {
    id: r.id,
    name: r.name,
    preferredName: r.preferredName,
    pronouns: r.pronouns,
    dateOfBirth: r.dateOfBirth,
    sexAtBirth: r.sexAtBirth,
    email: r.email,
    phone: r.phone,
    address: r.address,
    mrn: r.mrn,
    conditions: r.conditions ?? [],
    allergies: r.allergies ?? [],
    bloodType: r.bloodType,
    primaryPhysician: r.primaryPhysician,
    pharmacy: r.pharmacy,
    emergencyContactName: r.emergencyContactName,
    emergencyContactPhone: r.emergencyContactPhone,
    insuranceProvider: r.insuranceProvider,
    insurancePlan: r.insurancePlan,
    insuranceMemberId: r.insuranceMemberId,
    insuranceGroup: r.insuranceGroup,
  };
}

export function toAppointment(r: AppointmentRow): AppointmentDto {
  return {
    id: r.id,
    doctorName: r.doctorName,
    specialty: r.specialty,
    kind: r.kind as AppointmentDto["kind"],
    location: r.location,
    reason: r.reason,
    startsAt: r.startsAt.toISOString(),
    durationMin: r.durationMin,
    status: r.status as AppointmentDto["status"],
    notes: r.notes,
  };
}

export function toMedication(r: MedicationRow): MedicationDto {
  return {
    id: r.id,
    name: r.name,
    dosage: r.dosage,
    form: r.form,
    instructions: r.instructions,
    prescribedBy: r.prescribedBy,
    timesOfDay: r.timesOfDay ?? [],
    refillBy: r.refillBy,
    pillsLeft: r.pillsLeft,
    supplyDays: r.supplyDays,
    accent: r.accent,
    active: r.active,
  };
}

export function toDose(r: DoseRow): DoseDto {
  return {
    id: r.id,
    medicationId: r.medicationId,
    scheduledAt: r.scheduledAt.toISOString(),
    status: r.status as DoseDto["status"],
    takenAt: r.takenAt ? r.takenAt.toISOString() : null,
  };
}

export function toVital(r: VitalRow): VitalPointDto {
  return {
    id: r.id,
    type: r.type as VitalType,
    value: r.value,
    value2: r.value2,
    unit: r.unit,
    note: r.note,
    recordedAt: r.recordedAt.toISOString(),
  };
}

export function toMessage(r: MessageRow): MessageDto {
  return {
    id: r.id,
    sender: r.sender as MessageDto["sender"],
    authorName: r.authorName,
    authorRole: r.authorRole,
    body: r.body,
    createdAt: r.createdAt.toISOString(),
  };
}

/** Assembles the full app state in a handful of parallel queries. */
export async function getBootstrap(): Promise<BootstrapDto> {
  const now = new Date();
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);
  const endTomorrow = new Date(startToday.getTime() + 2 * DAY);
  const vitalsSince = new Date(now.getTime() - 30 * DAY);
  const weekStart = new Date(startToday.getTime() - 6 * DAY);

  const [pRows, apptRows, medRows, doseRows, vitalRows, msgRows, weekRowsRaw] =
    await Promise.all([
      db.select().from(patients).limit(1),
      db.select().from(appointments).orderBy(asc(appointments.startsAt)),
      db.select().from(medications).orderBy(asc(medications.id)),
      db
        .select()
        .from(doses)
        .where(
          and(gte(doses.scheduledAt, startToday), lt(doses.scheduledAt, endTomorrow)),
        )
        .orderBy(asc(doses.scheduledAt)),
      db
        .select()
        .from(vitals)
        .where(gte(vitals.recordedAt, vitalsSince))
        .orderBy(asc(vitals.recordedAt)),
      db.select().from(messages).orderBy(asc(messages.createdAt)),
      db
        .select()
        .from(doses)
        .where(and(gte(doses.scheduledAt, weekStart), lte(doses.scheduledAt, now)))
        .orderBy(desc(doses.scheduledAt)),
    ]);

  const grouped: Record<VitalType, VitalPointDto[]> = {
    heart_rate: [],
    blood_pressure: [],
    weight: [],
    glucose: [],
    oxygen: [],
  };
  for (const v of vitalRows) {
    const dto = toVital(v);
    if (grouped[dto.type]) grouped[dto.type].push(dto);
  }

  // 7-day adherence + per-day breakdown
  const weekDoses: { date: string; taken: number; total: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(startToday.getTime() - i * DAY);
    const key = dayStart.toISOString().slice(0, 10);
    const dayDoses = weekRowsRaw.filter((d) => {
      const t = d.scheduledAt.getTime();
      return t >= dayStart.getTime() && t < dayStart.getTime() + DAY;
    });
    weekDoses.push({
      date: key,
      total: dayDoses.length,
      taken: dayDoses.filter((d) => d.status === "taken").length,
    });
  }
  const wkTotal = weekDoses.reduce((a, b) => a + b.total, 0);
  const wkTaken = weekDoses.reduce((a, b) => a + b.taken, 0);

  const msgDtos = msgRows.map(toMessage);
  const lastPatientAt = msgDtos
    .filter((m) => m.sender === "patient")
    .map((m) => m.createdAt)
    .sort()
    .pop();
  const unreadCount = msgDtos.filter(
    (m) => m.sender === "care_team" && (!lastPatientAt || m.createdAt > lastPatientAt),
  ).length;

  return {
    now: now.toISOString(),
    patient: toPatient(pRows[0]),
    appointments: apptRows.map(toAppointment),
    medications: medRows.map(toMedication),
    doses: doseRows.map(toDose),
    vitals: grouped,
    adherence7: wkTotal ? wkTaken / wkTotal : 1,
    weekDoses,
    messages: msgDtos,
    unreadCount,
  };
}
