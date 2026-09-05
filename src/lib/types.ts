/** Shared API payload types used by both the web shell and API routes. */

export type AppointmentKind = "in_person" | "video" | "phone";
export type AppointmentStatus = "pending" | "confirmed" | "cancelled";
export type DoseStatus = "scheduled" | "taken" | "missed" | "skipped";
export type VitalType =
  | "heart_rate"
  | "blood_pressure"
  | "weight"
  | "glucose"
  | "oxygen";

export interface PatientDto {
  id: number;
  name: string;
  preferredName: string;
  pronouns: string;
  dateOfBirth: string;
  sexAtBirth: string;
  email: string;
  phone: string;
  address: string;
  mrn: string;
  conditions: string[];
  allergies: string[];
  bloodType: string;
  primaryPhysician: string;
  pharmacy: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  insuranceProvider: string;
  insurancePlan: string;
  insuranceMemberId: string;
  insuranceGroup: string;
}

export interface AppointmentDto {
  id: number;
  doctorName: string;
  specialty: string;
  kind: AppointmentKind;
  location: string;
  reason: string;
  startsAt: string;
  durationMin: number;
  status: AppointmentStatus;
  notes: string;
}

export interface MedicationDto {
  id: number;
  name: string;
  dosage: string;
  form: string;
  instructions: string;
  prescribedBy: string;
  timesOfDay: string[];
  refillBy: string;
  pillsLeft: number;
  supplyDays: number;
  accent: string;
  active: boolean;
}

export interface DoseDto {
  id: number;
  medicationId: number;
  scheduledAt: string;
  status: DoseStatus;
  takenAt: string | null;
}

export interface VitalPointDto {
  id: number;
  type: VitalType;
  value: number | null;
  value2: number | null;
  unit: string;
  note: string;
  recordedAt: string;
}

export interface MessageDto {
  id: number;
  sender: "patient" | "care_team";
  authorName: string;
  authorRole: string;
  body: string;
  createdAt: string;
}

/** Aggregate payload powering the whole app in one round-trip. */
export interface BootstrapDto {
  now: string;
  patient: PatientDto;
  appointments: AppointmentDto[];
  medications: MedicationDto[];
  doses: DoseDto[]; // today + tomorrow
  vitals: Record<VitalType, VitalPointDto[]>; // last 30 days, ascending
  adherence7: number; // 0..1
  weekDoses: { date: string; taken: number; total: number }[];
  messages: MessageDto[];
  unreadCount: number;
}
