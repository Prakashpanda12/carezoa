import type { VitalType } from "./types";

export const DOCTORS = [
  { name: "Dr. Priya Nair", specialty: "Cardiology" },
  { name: "Dr. Daniel Okafor", specialty: "Primary Care" },
  { name: "Dr. Sofia Reyes", specialty: "Endocrinology" },
  { name: "Dr. Lena Fischer", specialty: "Dermatology" },
  { name: "Dr. Omar Haddad", specialty: "Pulmonology" },
  { name: "James Park, DPT", specialty: "Physical Therapy" },
];

export const CARE_TEAM = [
  { name: "Joy Alvarez", role: "Registered Nurse" },
  { name: "Dr. Priya Nair", role: "Cardiologist" },
  { name: "Marcus Webb", role: "Care Coordinator" },
];

export const VITAL_META: Record<
  VitalType,
  {
    label: string;
    unit: string;
    normal: string;
    decimals: number;
    accent: string;
    dual?: boolean;
  }
> = {
  heart_rate: {
    label: "Heart rate",
    unit: "bpm",
    normal: "60–100",
    decimals: 0,
    accent: "#E85D6A",
  },
  blood_pressure: {
    label: "Blood pressure",
    unit: "mmHg",
    normal: "< 120/80",
    decimals: 0,
    accent: "#7C6CE8",
    dual: true,
  },
  weight: {
    label: "Weight",
    unit: "kg",
    normal: "goal 60–62",
    decimals: 1,
    accent: "#0E9F8A",
  },
  glucose: {
    label: "Glucose",
    unit: "mg/dL",
    normal: "70–140",
    decimals: 0,
    accent: "#E9A13B",
  },
  oxygen: {
    label: "SpO₂",
    unit: "%",
    normal: "95–100",
    decimals: 0,
    accent: "#3E9FE8",
  },
};

export const TIME_SLOTS = [
  "08:30",
  "09:15",
  "10:00",
  "11:30",
  "13:00",
  "14:30",
  "15:45",
  "16:30",
];
