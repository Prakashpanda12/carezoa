import { db } from "@/db";
import {
  appointments,
  doses,
  medications,
  messages,
  patients,
  vitals,
} from "@/db/schema";
import { sql } from "drizzle-orm";

/** Deterministic PRNG so seeded vitals look organic but stable. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAY = 86_400_000;
const HOUR = 3_600_000;

function at(daysFromNow: number, hhmm: string, jitterMin = 0, rand?: () => number) {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(Date.now() + daysFromNow * DAY);
  d.setHours(h, m, 0, 0);
  if (jitterMin && rand) {
    d.setMinutes(d.getMinutes() + Math.round((rand() - 0.5) * jitterMin));
  }
  return d;
}

let seedPromise: Promise<void> | null = null;

/** Seeds the database on first use; safe to call from any route handler. */
export function ensureSeed(): Promise<void> {
  if (!seedPromise) {
    seedPromise = doSeed().catch((err) => {
      seedPromise = null;
      throw err;
    });
  }
  return seedPromise;
}

async function doSeed() {
  const existing = await db.execute(sql`select id from patients limit 1`);
  if (existing.rows.length > 0) return;

  const rand = mulberry32(20260214);

  await db.insert(patients).values({
    name: "Maya Chen",
    preferredName: "Maya",
    pronouns: "she/her",
    dateOfBirth: "1991-09-14",
    sexAtBirth: "F",
    email: "maya.chen@example.com",
    phone: "(415) 555-0142",
    address: "418 Laguna St Apt 3, San Francisco, CA 94102",
    mrn: "MRN-00481239",
    conditions: ["Hypertension (controlled)", "Mild persistent asthma", "Prediabetes"],
    allergies: ["Penicillin", "Peanuts"],
    bloodType: "O+",
    primaryPhysician: "Dr. Daniel Okafor",
    pharmacy: "Walgreens — Market St, SF",
    emergencyContactName: "David Chen (brother)",
    emergencyContactPhone: "(415) 555-0198",
    insuranceProvider: "Blue Shield of California",
    insurancePlan: "Trio HMO Gold 80",
    insuranceMemberId: "BSC-88214376",
    insuranceGroup: "GRP-55210",
  });

  const [lisinopril, metformin, vitaminD, albuterol] = await db
    .insert(medications)
    .values([
      {
        name: "Lisinopril",
        dosage: "10 mg",
        form: "tablet",
        instructions: "Take once daily in the morning with water.",
        prescribedBy: "Dr. Priya Nair",
        timesOfDay: ["08:00"],
        refillBy: isoDay(24),
        pillsLeft: 22,
        supplyDays: 30,
        accent: "emerald",
      },
      {
        name: "Metformin",
        dosage: "500 mg",
        form: "tablet",
        instructions: "Take twice daily with breakfast and dinner.",
        prescribedBy: "Dr. Sofia Reyes",
        timesOfDay: ["08:30", "19:30"],
        refillBy: isoDay(11),
        pillsLeft: 14,
        supplyDays: 60,
        accent: "amber",
      },
      {
        name: "Vitamin D3",
        dosage: "2000 IU",
        form: "capsule",
        instructions: "Take daily with a meal.",
        prescribedBy: "Dr. Daniel Okafor",
        timesOfDay: ["09:00"],
        refillBy: isoDay(52),
        pillsLeft: 45,
        supplyDays: 90,
        accent: "sky",
      },
      {
        name: "Albuterol",
        dosage: "90 mcg",
        form: "inhaler",
        instructions: "2 puffs as needed for shortness of breath.",
        prescribedBy: "Dr. Omar Haddad",
        timesOfDay: [],
        refillBy: isoDay(75),
        pillsLeft: 1,
        supplyDays: 1,
        accent: "rose",
      },
    ])
    .returning({ id: medications.id, timesOfDay: medications.timesOfDay });

  // ---- Doses: 14 days of history + today + tomorrow ----------------------
  const doseRows: {
    medicationId: number;
    scheduledAt: Date;
    status: string;
    takenAt: Date | null;
  }[] = [];
  const now = Date.now();
  for (const med of [lisinopril, metformin, vitaminD]) {
    for (const t of med.timesOfDay) {
      for (let day = -14; day <= 1; day++) {
        const scheduled = at(day, t, 0);
        const schedMs = scheduled.getTime();
        if (schedMs > now + DAY) continue;
        if (schedMs <= now - DAY + HOUR * 3) {
          // history: ~88% taken, deterministic
          const roll = rand();
          const status = roll < 0.88 ? "taken" : roll < 0.94 ? "missed" : "skipped";
          doseRows.push({
            medicationId: med.id,
            scheduledAt: scheduled,
            status,
            takenAt:
              status === "taken"
                ? new Date(schedMs + Math.round(rand() * 55) * 60_000)
                : null,
          });
        } else if (schedMs < now - 45 * 60_000) {
          // earlier today, still unlogged
          doseRows.push({
            medicationId: med.id,
            scheduledAt: scheduled,
            status: rand() < 0.75 ? "taken" : "missed",
            takenAt: null,
          });
        } else {
          doseRows.push({
            medicationId: med.id,
            scheduledAt: scheduled,
            status: "scheduled",
            takenAt: null,
          });
        }
      }
    }
  }
  await db.insert(doses).values(doseRows);

  // ---- Appointments -------------------------------------------------------
  await db.insert(appointments).values([
    {
      doctorName: "Dr. Priya Nair",
      specialty: "Cardiology",
      kind: "video",
      location: "Solace Video Visit",
      reason: "Hypertension follow-up",
      startsAt: at(2, "10:00"),
      durationMin: 25,
      status: "confirmed",
      notes: "Have your home BP readings from the last 2 weeks ready.",
    },
    {
      doctorName: "Dr. Daniel Okafor",
      specialty: "Primary Care",
      kind: "in_person",
      location: "Hayes Valley Clinic, 450 Hayes St",
      reason: "Annual physical exam",
      startsAt: at(9, "09:15"),
      durationMin: 45,
      status: "confirmed",
      notes: "Fasting 8 hours before labs.",
    },
    {
      doctorName: "James Park, DPT",
      specialty: "Physical Therapy",
      kind: "in_person",
      location: "Motion Lab, 88 Folsom St",
      reason: "Shoulder mobility evaluation",
      startsAt: at(5, "14:30"),
      durationMin: 50,
      status: "pending",
    },
    {
      doctorName: "Dr. Lena Fischer",
      specialty: "Dermatology",
      kind: "in_person",
      location: "Skin Health SF, 2100 Webster St",
      reason: "Annual skin screening",
      startsAt: at(-19, "11:30"),
      durationMin: 30,
      status: "confirmed",
    },
    {
      doctorName: "Dr. Daniel Okafor",
      specialty: "Primary Care",
      kind: "phone",
      location: "Phone call",
      reason: "Lab results review",
      startsAt: at(-34, "16:00"),
      durationMin: 15,
      status: "confirmed",
    },
  ]);

  // ---- Vitals: 30 days, ascending ----------------------------------------
  const vitalRows: {
    type: string;
    value: number | null;
    value2: number | null;
    unit: string;
    recordedAt: Date;
  }[] = [];
  for (let day = -29; day <= 0; day++) {
    const w = Math.sin(day / 4.7);
    vitalRows.push({
      type: "heart_rate",
      value: Math.round(68 + w * 6 + (rand() - 0.5) * 10),
      value2: null,
      unit: "bpm",
      recordedAt: at(day, "07:45", 30, rand),
    });
    vitalRows.push({
      type: "blood_pressure",
      value: Math.round(118 + w * 4 + (rand() - 0.5) * 8),
      value2: Math.round(76 + w * 3 + (rand() - 0.5) * 5),
      unit: "mmHg",
      recordedAt: at(day, "08:05", 40, rand),
    });
    if (day % 3 !== 1) {
      vitalRows.push({
        type: "glucose",
        value: Math.round(101 + w * 7 + (rand() - 0.5) * 12),
        value2: null,
        unit: "mg/dL",
        recordedAt: at(day, "07:55", 25, rand),
      });
    }
    if (day % 2 === 0) {
      vitalRows.push({
        type: "weight",
        value: Math.round((61.6 - day * 0.02 + (rand() - 0.5) * 0.9) * 10) / 10,
        value2: null,
        unit: "kg",
        recordedAt: at(day, "07:30", 20, rand),
      });
    }
    vitalRows.push({
      type: "oxygen",
      value: Math.round(97 + (rand() - 0.4) * 2),
      value2: null,
      unit: "%",
      recordedAt: at(day, "21:10", 50, rand),
    });
  }
  await db.insert(vitals).values(vitalRows);

  // ---- Messages -----------------------------------------------------------
  await db.insert(messages).values([
    {
      sender: "care_team",
      authorName: "Joy Alvarez",
      authorRole: "Registered Nurse",
      body: "Hi Maya! Dr. Nair asked me to check in — how have your home blood pressure readings been this week?",
      createdAt: at(-2, "09:12"),
    },
    {
      sender: "patient",
      authorName: "Maya Chen",
      authorRole: "",
      body: "Hey Joy! Mostly around 118/76 in the mornings. A couple of higher evenings after work stress, up to 128/82.",
      createdAt: at(-2, "10:03"),
    },
    {
      sender: "care_team",
      authorName: "Joy Alvarez",
      authorRole: "Registered Nurse",
      body: "That's really helpful, thank you. The morning numbers look great — right in target range. Keep logging them in the Health tab and we'll review the trend at your video visit on Thursday.",
      createdAt: at(-2, "10:21"),
    },
    {
      sender: "care_team",
      authorName: "Marcus Webb",
      authorRole: "Care Coordinator",
      body: "Reminder: your Metformin refill will be ready at Walgreens on Market St in about 10 days. Want me to set up auto-refill so you don't have to think about it?",
      createdAt: at(-1, "15:40"),
    },
    {
      sender: "patient",
      authorName: "Maya Chen",
      authorRole: "",
      body: "Yes please, that would be great. Also — should I keep taking Metformin the morning of my fasting labs?",
      createdAt: at(-1, "16:02"),
    },
  ]);
}

function isoDay(daysFromNow: number) {
  return new Date(Date.now() + daysFromNow * DAY).toISOString().slice(0, 10);
}
