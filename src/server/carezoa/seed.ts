import { db } from "@/db";
import {
  czBookings,
  czFamily,
  czMessages,
  czPackages,
  czPatients,
  czPaymentMethods,
  czProviders,
  czRecords,
  czReviews,
  czServices,
  czTickets,
} from "@/db/schema";
import { sql } from "drizzle-orm";

const DAY = 86_400_000;
const HOUR = 3_600_000;

function at(daysFromNow: number, hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(Date.now() + daysFromNow * DAY);
  d.setHours(h, m, 0, 0);
  return d;
}

let seedPromise: Promise<void> | null = null;
export function ensureCarezoaSeed(): Promise<void> {
  if (!seedPromise) {
    seedPromise = seed().catch((e) => {
      seedPromise = null;
      throw e;
    });
  }
  return seedPromise;
}

async function seed() {
  const existing = await db.execute(sql`select id from cz_patients limit 1`);
  if (existing.rows.length > 0) return;

  await db.insert(czPatients).values({
    id: 1,
    name: "Maya Mohanty",
    phone: "+919437000001",
    dob: "08/03/1992",
    gender: "F",
    city: "Bhubaneswar",
    address: "Flat 4B, Silver Oak Residency, Patia",
    onboardingDone: true,
  });

  await db.insert(czServices).values([
    { category: "Nursing", name: "Home Nursing Visit", description: "Registered nurse home visit: vitals, medications, wound care, catheter care.", durationMin: 60, basePriceInr: 799, icon: "medkit" },
    { category: "Elder Care", name: "Elder Companion Care", description: "Trained attendant for companionship, meals, mobility help and daily routine.", durationMin: 180, basePriceInr: 1199, icon: "heart" },
    { category: "Recovery", name: "Post-Surgery Care", description: "Structured post-op recovery visits: dressing, pain protocol, mobility plan.", durationMin: 90, basePriceInr: 1499, icon: "bandage" },
    { category: "Recovery", name: "Physiotherapy Session", description: "Licensed physiotherapist session at home with exercise plan.", durationMin: 45, basePriceInr: 999, icon: "walk" },
    { category: "Procedures", name: "Injection / IV at Home", description: "Safe administration of prescribed injections or IV drips at home.", durationMin: 30, basePriceInr: 499, icon: "eyedrop" },
    { category: "Elder Care", name: "Attendant — Day Shift", description: "Verified attendant for a full 12-hour day shift with an elderly patient.", durationMin: 720, basePriceInr: 1899, icon: "people" },
  ]);

  const [suresh, anita, priyanka, ramesh, kavita, debasish] = await db
    .insert(czProviders)
    .values([
      { name: "Suresh Patra", title: "Critical Care Nurse", qualifications: ["BSc Nursing", "ICU Certified"], languages: ["Odia", "Hindi", "English"], city: "Bhubaneswar", lat: 20.3525, lng: 85.8194, coverageKm: 15, rating: 4.9, reviewsCount: 132, yearsExp: 9, bio: "Ex-AMRI ICU nurse. Specialises in post-cardiac and ventilator-stepdown home care.", photoColor: "moss", nextAvailableAt: at(0, "18:00") },
      { name: "Anita Das", title: "Elder Care Specialist", qualifications: ["GNM", "Dementia Care Trained"], languages: ["Odia", "Hindi"], city: "Bhubaneswar", lat: 20.3311, lng: 85.8345, coverageKm: 12, rating: 4.8, reviewsCount: 98, yearsExp: 7, bio: "Gentle, patient-first elder companion care. Experienced with Parkinson's and post-stroke routines.", photoColor: "gold" },
      { name: "Priyanka Sahoo", title: "Post-Op Recovery Nurse", qualifications: ["MSc Nursing"], languages: ["Odia", "English"], city: "Bhubaneswar", lat: 20.2961, lng: 85.8245, coverageKm: 18, rating: 4.9, reviewsCount: 76, yearsExp: 6, bio: "Surgical recovery pathway specialist — ortho, abdominal and C-section aftercare.", photoColor: "lilac" },
      { name: "Ramesh Behera", title: "Physiotherapist", qualifications: ["BPT", "MPT (Ortho)"], languages: ["Odia", "Hindi", "English"], city: "Cuttack", lat: 20.4625, lng: 85.883, coverageKm: 25, rating: 4.7, reviewsCount: 210, yearsExp: 11, bio: "Home-based rehab for knee/hip replacement, stroke and sports injuries.", photoColor: "sky" },
      { name: "Kavita Mishra", title: "Procedures Nurse", qualifications: ["ANM", "IV Therapy Certified"], languages: ["Odia"], city: "Bhubaneswar", lat: 20.3152, lng: 85.8085, coverageKm: 10, rating: 4.6, reviewsCount: 54, yearsExp: 5, bio: "Quick, careful injectables and IV administration at home.", photoColor: "blush" },
      { name: "Debasish Lenka", title: "ICU Nurse", qualifications: ["BSc Nursing", "ACLS"], languages: ["Odia", "Hindi", "English"], city: "Bhubaneswar", lat: 20.3402, lng: 85.8097, coverageKm: 20, rating: 4.8, reviewsCount: 140, yearsExp: 8, bio: "High-acuity home support: tracheostomy, NG feeds, advanced wound care.", photoColor: "ink" },
    ])
    .returning({ id: czProviders.id });

  await db.insert(czReviews).values([
    { providerId: suresh.id, authorName: "S. Mohanty", rating: 5, text: "Suresh managed my father's post-bypass care flawlessly. Explained everything to us on video call since we live in Bangalore.", createdAt: at(-22, "11:00") },
    { providerId: suresh.id, authorName: "R. Tripathy", rating: 5, text: "Punctual, calm, extremely competent with IV and dressings.", createdAt: at(-9, "16:30") },
    { providerId: anita.id, authorName: "P. Das", rating: 5, text: "My mother waits for Anita's visits all week. She treats her like family.", createdAt: at(-15, "09:20") },
    { providerId: anita.id, authorName: "K. Jena", rating: 4, text: "Very kind and reliable attendant for evening companionship.", createdAt: at(-4, "18:00") },
    { providerId: priyanka.id, authorName: "M. Rao", rating: 5, text: "Post knee-replacement recovery was smooth under her plan.", createdAt: at(-12, "13:00") },
    { providerId: ramesh.id, authorName: "D. Panda", rating: 4, text: "Strict but effective physio. Dad is walking without support now.", createdAt: at(-7, "10:15") },
  ]);

  const svc = await db.select().from(czServices);
  const byName = Object.fromEntries(svc.map((s) => [s.name, s]));

  const [b1, b2, b3] = await db
    .insert(czBookings)
    .values([
      {
        providerId: anita.id,
        serviceId: byName["Elder Companion Care"].id,
        status: "confirmed",
        paymentStatus: "paid",
        startsAt: at(1, "10:00"),
        durationMin: 180,
        patientName: "Biren Mohanty",
        patientAge: 68,
        patientGender: "M",
        address: "Flat 4B, Silver Oak Residency, Patia",
        city: "Bhubaneswar",
        instructions: "Father is hard of hearing in the left ear — please speak on his right side. Likes tea at 10:30.",
        amountInr: 1199,
        confirmedAt: at(-1, "17:05"),
      },
      {
        providerId: suresh.id,
        serviceId: byName["Home Nursing Visit"].id,
        status: "completed",
        paymentStatus: "paid",
        startsAt: at(-1, "09:00"),
        durationMin: 60,
        patientName: "Sunita Mohanty",
        patientAge: 64,
        patientGender: "F",
        address: "Flat 4B, Silver Oak Residency, Patia",
        city: "Bhubaneswar",
        instructions: "Post-discharge BP and sugar monitoring.",
        amountInr: 799,
        confirmedAt: at(-2, "19:00"),
        enRouteAt: at(-1, "08:21"),
        checkedInAt: at(-1, "08:55"),
        startedAt: at(-1, "09:02"),
        completedAt: at(-1, "10:05"),
        checkinOtp: "7315",
      },
      {
        providerId: kavita.id,
        serviceId: byName["Injection / IV at Home"].id,
        status: "completed",
        paymentStatus: "paid",
        startsAt: at(-4, "18:00"),
        durationMin: 30,
        patientName: "Biren Mohanty",
        patientAge: 68,
        patientGender: "M",
        address: "Flat 4B, Silver Oak Residency, Patia",
        city: "Bhubaneswar",
        instructions: "Prescribed B12 injection — prescription attached in records.",
        amountInr: 499,
        confirmedAt: at(-4, "12:00"),
        enRouteAt: at(-4, "17:32"),
        checkedInAt: at(-4, "17:58"),
        startedAt: at(-4, "18:03"),
        completedAt: at(-4, "18:30"),
        checkinOtp: "2049",
      },
    ])
    .returning({ id: czBookings.id });

  await db.insert(czMessages).values([
    { bookingId: b1.id, sender: "provider", authorName: "Anita Das", body: "Namaste Maya ji! I'll reach by 9:50 tomorrow morning. Should I bring anything specific for your father's breakfast routine?", createdAt: at(-1, "18:02") },
    { bookingId: b1.id, sender: "patient", authorName: "Maya Mohanty", body: "Namaste! Nothing needed, the kitchen is stocked. He prefers oats over rice in the morning these days.", createdAt: at(-1, "18:20") },
    { bookingId: b1.id, sender: "provider", authorName: "Anita Das", body: "Noted — oats it is. I'll also take him for a short corridor walk after breakfast if he feels up to it.", createdAt: at(-1, "18:41") },
  ]);

  await db.insert(czRecords).values([
    {
      bookingId: b2.id,
      summary: "Post-discharge monitoring visit completed. Vitals stable; BP improved versus discharge readings. Continued medication as per discharge summary.",
      vitals: { "Blood pressure": "128/84 mmHg", Pulse: "78 bpm", SpO2: "97%", Temperature: "98.2°F", "Blood sugar (random)": "142 mg/dL" },
      notes: "Advised low-salt diet and evening walk. Next review recommended in 5 days.",
    },
    {
      bookingId: b3.id,
      summary: "Vitamin B12 injection administered intramuscularly without complications. Site observed for 15 minutes post-injection — no reaction.",
      vitals: { Pulse: "74 bpm" },
      notes: "Next dose due in 7 days as per prescription.",
    },
  ]);

  await db.insert(czFamily).values([
    { patientId: 1, name: "Biren Mohanty", relation: "Father", phone: "+919438100201", accessScope: { viewVisits: true, viewRecords: true, chat: true }, inviteStatus: "active" },
    { patientId: 1, name: "Sunita Mohanty", relation: "Mother", phone: "+919438100202", accessScope: { viewVisits: true, viewRecords: false, chat: false }, inviteStatus: "pending" },
  ]);

  await db.insert(czPackages).values([
    { name: "Elder Essentials", description: "Routine companionship and wellness checks for independent elders.", visitsPerMonth: 8, pricePerMonthInr: 3999, includes: ["4 companion visits (3h)", "4 nursing check-ins", "Monthly vitals report to family", "Priority same-day booking"], bestFor: "Independent elders living alone" },
    { name: "Post-Op Recovery", description: "Intense first-month recovery pathway after surgery.", visitsPerMonth: 10, pricePerMonthInr: 5499, includes: ["6 post-op nursing visits", "2 physiotherapy sessions", "2 wound-care visits", "Daily check-in calls"], bestFor: "First 4 weeks after discharge" },
    { name: "Chronic Care Plus", description: "Ongoing support for diabetes, hypertension and cardiac conditions.", visitsPerMonth: 12, pricePerMonthInr: 6999, includes: ["8 nursing visits", "4 attendant day-shifts", "Medication management", "Quarterly doctor coordination"], bestFor: "Long-term condition management" },
  ]);

  await db.insert(czPaymentMethods).values([
    { patientId: 1, type: "upi", label: "UPI", detail: "maya.m@okhdfc" },
    { patientId: 1, type: "card", label: "Visa", detail: "•••• 4242" },
  ]);

  await db.insert(czTickets).values([
    { patientId: 1, subject: "Reschedule day-shift timing", body: "Can the attendant shift on the 12th start at 8am instead of 9am? Father has a hospital appointment that morning.", status: "open" },
  ]);
}
