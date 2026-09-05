import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Offline-tolerant booking draft: every keystroke/step survives app
 * backgrounding, restarts and connectivity loss (AsyncStorage-backed).
 */
export interface BookingDraft {
  step: 0 | 1 | 2;
  providerId: number | null;
  providerName: string;
  serviceId: number | null;
  serviceName: string;
  serviceDurationMin: number;
  priceInr: number;
  dateISO: string | null; // day part
  slot: string | null; // "HH:mm"
  patientName: string;
  age: string;
  gender: "F" | "M" | "O";
  address: string;
  city: string;
  instructions: string;
}

const EMPTY: BookingDraft = {
  step: 0,
  providerId: null,
  providerName: "",
  serviceId: null,
  serviceName: "",
  serviceDurationMin: 60,
  priceInr: 0,
  dateISO: null,
  slot: null,
  patientName: "",
  age: "",
  gender: "F",
  address: "",
  city: "",
  instructions: "",
};

interface DraftStore extends BookingDraft {
  update: (patch: Partial<BookingDraft>) => void;
  reset: (keepProvider?: boolean) => void;
}

export const useBookingDraft = create<DraftStore>()(
  persist(
    (set, get) => ({
      ...EMPTY,
      update: (patch) => set(patch),
      reset: (keepProvider) => {
        const { providerId, providerName } = get();
        set({
          ...EMPTY,
          ...(keepProvider ? { providerId, providerName } : {}),
        });
      },
    }),
    {
      name: "carezoa.booking-draft",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export function draftToStartsAt(d: BookingDraft): string | null {
  if (!d.dateISO || !d.slot) return null;
  const [h, m] = d.slot.split(":").map(Number);
  const date = new Date(d.dateISO);
  date.setHours(h, m, 0, 0);
  return date.toISOString();
}

/**
 * Book Again (retention control): prefill a NEW draft from a completed visit,
 * defaulting to the SAME provider, service, patient and address.
 */
export function bookingToDraft(booking: {
  providerId: number;
  serviceId: number;
  provider?: { name: string } | undefined;
  service?: { name: string; durationMin: number; basePriceInr: number } | undefined;
  patient: { name: string; age: number; gender: string };
  address: string;
  city: string;
  instructions: string;
}): Partial<BookingDraft> {
  return {
    step: 0,
    providerId: booking.providerId,
    providerName: booking.provider?.name ?? "",
    serviceId: booking.serviceId,
    serviceName: booking.service?.name ?? "",
    serviceDurationMin: booking.service?.durationMin ?? 60,
    priceInr: booking.service?.basePriceInr ?? 0,
    dateISO: null,
    slot: null,
    patientName: booking.patient.name,
    age: String(booking.patient.age),
    gender: (booking.patient.gender || "F") as "F" | "M" | "O",
    address: booking.address,
    city: booking.city,
    instructions: booking.instructions,
  };
}
