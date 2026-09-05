import type {
  AppointmentDto,
  BootstrapDto,
  DoseDto,
  DoseStatus,
  MedicationDto,
  MessageDto,
  PatientDto,
  VitalPointDto,
  VitalType,
} from "./types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export const api = {
  getBootstrap: () => request<BootstrapDto>("/api/bootstrap"),

  patchPatient: (patch: Partial<PatientDto>) =>
    request<PatientDto>("/api/patient", {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),

  createAppointment: (payload: {
    doctorName: string;
    specialty: string;
    kind: AppointmentDto["kind"];
    reason: string;
    startsAt: string;
    durationMin?: number;
    notes?: string;
  }) =>
    request<AppointmentDto>("/api/appointments", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  patchAppointment: (id: number, action: "cancel" | "confirm" | "reopen") =>
    request<AppointmentDto>(`/api/appointments/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ action }),
    }),

  addMedication: (payload: {
    name: string;
    dosage: string;
    form: string;
    instructions: string;
    timesOfDay: string[];
    prescribedBy?: string;
  }) =>
    request<MedicationDto>("/api/medications", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  patchMedication: (id: number, patch: { active: boolean }) =>
    request<MedicationDto>(`/api/medications/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),

  logDose: (payload: {
    medicationId: number;
    scheduledAt: string;
    action: DoseStatus;
  }) =>
    request<DoseDto>("/api/doses", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  logVital: (payload: {
    type: VitalType;
    value: number;
    value2?: number;
    note?: string;
    recordedAt?: string;
  }) =>
    request<VitalPointDto>("/api/vitals", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  sendMessage: (body: string) =>
    request<{ sent: MessageDto; reply: MessageDto }>("/api/messages", {
      method: "POST",
      body: JSON.stringify({ body }),
    }),
};
