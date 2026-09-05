import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/** The single signed-in patient (demo app is single-user). */
export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  preferredName: text("preferred_name").notNull(),
  pronouns: text("pronouns").notNull().default("she/her"),
  dateOfBirth: text("date_of_birth").notNull(),
  sexAtBirth: text("sex_at_birth").notNull().default("F"),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  mrn: text("mrn").notNull(),
  conditions: jsonb("conditions").$type<string[]>().notNull().default([]),
  allergies: jsonb("allergies").$type<string[]>().notNull().default([]),
  bloodType: text("blood_type").notNull().default("O+"),
  primaryPhysician: text("primary_physician").notNull(),
  pharmacy: text("pharmacy").notNull(),
  emergencyContactName: text("emergency_contact_name").notNull(),
  emergencyContactPhone: text("emergency_contact_phone").notNull(),
  insuranceProvider: text("insurance_provider").notNull(),
  insurancePlan: text("insurance_plan").notNull(),
  insuranceMemberId: text("insurance_member_id").notNull(),
  insuranceGroup: text("insurance_group").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().default(1),
  doctorName: text("doctor_name").notNull(),
  specialty: text("specialty").notNull(),
  kind: text("kind").notNull().default("in_person"), // in_person | video | phone
  location: text("location").notNull(),
  reason: text("reason").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  durationMin: integer("duration_min").notNull().default(30),
  status: text("status").notNull().default("pending"), // pending | confirmed | cancelled
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const medications = pgTable("medications", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().default(1),
  name: text("name").notNull(),
  dosage: text("dosage").notNull(),
  form: text("form").notNull().default("tablet"), // tablet | capsule | inhaler | liquid
  instructions: text("instructions").notNull().default(""),
  prescribedBy: text("prescribed_by").notNull(),
  timesOfDay: jsonb("times_of_day").$type<string[]>().notNull().default([]), // ["08:00","20:00"]
  refillBy: text("refill_by").notNull(),
  pillsLeft: integer("pills_left").notNull().default(30),
  supplyDays: integer("supply_days").notNull().default(30),
  accent: text("accent").notNull().default("emerald"), // emerald | amber | sky | rose
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const doses = pgTable("doses", {
  id: serial("id").primaryKey(),
  medicationId: integer("medication_id").notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  status: text("status").notNull().default("scheduled"), // scheduled | taken | missed | skipped
  takenAt: timestamp("taken_at", { withTimezone: true }),
});

export const vitals = pgTable("vitals", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().default(1),
  type: text("type").notNull(), // heart_rate | blood_pressure | weight | glucose | oxygen
  value: doublePrecision("value"), // primary value (hr, weight, glucose, oxygen, or systolic)
  value2: doublePrecision("value2"), // diastolic for blood_pressure
  unit: text("unit").notNull(),
  note: text("note").notNull().default(""),
  recordedAt: timestamp("recorded_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().default(1),
  sender: text("sender").notNull(), // patient | care_team
  authorName: text("author_name").notNull(),
  authorRole: text("author_role").notNull().default(""),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type PatientRow = typeof patients.$inferSelect;
export type AppointmentRow = typeof appointments.$inferSelect;
export type MedicationRow = typeof medications.$inferSelect;
export type DoseRow = typeof doses.$inferSelect;
export type VitalRow = typeof vitals.$inferSelect;
export type MessageRow = typeof messages.$inferSelect;

// =====================================================================
// CAREZOA marketplace API (/api/v1) — mock/dev backend tables
// =====================================================================

export const czPatients = pgTable("cz_patients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  dob: text("dob").notNull().default(""),
  gender: text("gender").notNull().default(""),
  city: text("city").notNull().default(""),
  address: text("address").notNull().default(""),
  onboardingDone: boolean("onboarding_done").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const czServices = pgTable("cz_services", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  durationMin: integer("duration_min").notNull(),
  basePriceInr: integer("base_price_inr").notNull(),
  icon: text("icon").notNull().default("medkit"),
});

export const czProviders = pgTable("cz_providers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  title: text("title").notNull(),
  qualifications: jsonb("qualifications").$type<string[]>().notNull().default([]),
  languages: jsonb("languages").$type<string[]>().notNull().default([]),
  city: text("city").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  coverageKm: doublePrecision("coverage_km").notNull().default(15),
  rating: doublePrecision("rating").notNull().default(4.5),
  reviewsCount: integer("reviews_count").notNull().default(0),
  yearsExp: integer("years_exp").notNull().default(5),
  verified: boolean("verified").notNull().default(true),
  bio: text("bio").notNull().default(""),
  photoColor: text("photo_color").notNull().default("moss"),
  nextAvailableAt: timestamp("next_available_at", { withTimezone: true }),
});

export const czReviews = pgTable("cz_reviews", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").notNull(),
  authorName: text("author_name").notNull(), // already masked, e.g. "S. Mohanty"
  rating: integer("rating").notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const czBookings = pgTable("cz_bookings", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().default(1),
  providerId: integer("provider_id").notNull(),
  serviceId: integer("service_id").notNull(),
  status: text("status").notNull().default("scheduled"), // scheduled|confirmed|en_route|checked_in|in_service|completed|cancelled
  paymentStatus: text("payment_status").notNull().default("unpaid"), // unpaid|pending|paid|failed
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  durationMin: integer("duration_min").notNull().default(60),
  patientName: text("patient_name").notNull(),
  patientAge: integer("patient_age").notNull(),
  patientGender: text("patient_gender").notNull().default(""),
  address: text("address").notNull(),
  city: text("city").notNull(),
  instructions: text("instructions").notNull().default(""),
  amountInr: integer("amount_inr").notNull(),
  checkinOtp: text("checkin_otp"), // revealed to family only; provider never receives it
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  enRouteAt: timestamp("en_route_at", { withTimezone: true }),
  checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const czMessages = pgTable("cz_messages", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull(),
  sender: text("sender").notNull(), // patient | provider
  authorName: text("author_name").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const czRecords = pgTable("cz_records", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull(),
  summary: text("summary").notNull(),
  vitals: jsonb("vitals").$type<Record<string, string>>().notNull().default({}),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const czFamily = pgTable("cz_family", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().default(1),
  name: text("name").notNull(),
  relation: text("relation").notNull(),
  phone: text("phone").notNull(),
  accessScope: jsonb("access_scope")
    .$type<{ viewVisits: boolean; viewRecords: boolean; chat: boolean }>()
    .notNull()
    .default({ viewVisits: true, viewRecords: false, chat: false }),
  inviteStatus: text("invite_status").notNull().default("pending"), // pending|active|revoked
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const czPackages = pgTable("cz_packages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  visitsPerMonth: integer("visits_per_month").notNull(),
  pricePerMonthInr: integer("price_per_month_inr").notNull(),
  includes: jsonb("includes").$type<string[]>().notNull().default([]),
  bestFor: text("best_for").notNull().default(""),
});

export const czSubscriptions = pgTable("cz_subscriptions", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().default(1),
  packageId: integer("package_id").notNull(),
  status: text("status").notNull().default("active"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
});

export const czTickets = pgTable("cz_tickets", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().default(1),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const czPaymentMethods = pgTable("cz_payment_methods", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().default(1),
  type: text("type").notNull(), // card | upi
  label: text("label").notNull(),
  detail: text("detail").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const czPayments = pgTable("cz_payments", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull(),
  methodId: integer("method_id"),
  amountInr: integer("amount_inr").notNull(),
  currency: text("currency").notNull().default("INR"),
  status: text("status").notNull().default("pending"), // pending|success|failed
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type CzBookingRow = typeof czBookings.$inferSelect;
export type CzProviderRow = typeof czProviders.$inferSelect;
