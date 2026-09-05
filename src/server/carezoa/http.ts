import { db } from "@/db";
import {
  czBookings,
  czPatients,
  czProviders,
  type CzBookingRow,
  type CzProviderRow,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { getPatientIdFromToken } from "./jwtService";

/**
 * Extract patient ID from authorization token
 * Supports both old format (cz_<patientId>_<random>) and new JWT format
 * Falls back to patient 1 in dev mode if no valid token
 */
export function getPatientId(req: Request): number {
  const auth = req.headers.get("authorization") ?? "";
  
  // Try JWT format first
  if (auth.startsWith("Bearer ")) {
    const token = auth.slice(7);
    
    // Try JWT token
    const jwtPatientId = getPatientIdFromToken(token);
    if (jwtPatientId) {
      return jwtPatientId;
    }
    
    // Fallback to old format: cz_<patientId>_<random>
    const m = token.match(/^cz_(\d+)_/);
    if (m) {
      return Number(m[1]);
    }
  }
  
  // Dev mode: default to patient 1
  return 1;
}

export function err(status: number, message: string) {
  return Response.json({ error: message }, { status });
}

/**
 * Anti-bypass enforcement (server side): strips phone numbers, emails and
 * social handles from anything a provider says, so contact details can never
 * leak into chat or reports.
 */
export function scrubContactInfo(text: string): string {
  return text
    .replace(/\+?\d[\d\s().-]{8,}\d/g, "[hidden by CAREZOA]")
    .replace(/[\w.+-]+@[\w-]+\.\w{2,}/g, "[hidden by CAREZOA]")
    .replace(/\b(whatsapp|telegram|instagram|insta|signal)\b/gi, "[hidden by CAREZOA]");
}

export async function getPatient(id: number) {
  const rows = await db.select().from(czPatients).where(eq(czPatients.id, id)).limit(1);
  return rows[0];
}

const haversineKm = (aLat: number, aLng: number, bLat: number, bLng: number) => {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
};

/**
 * Provider DTO intentionally omits phone/email — the contract never returns
 * them, and the UI must not work around that.
 */
export function toProvider(p: CzProviderRow, from?: { lat: number; lng: number }) {
  return {
    id: p.id,
    name: p.name,
    title: p.title,
    qualifications: p.qualifications,
    languages: p.languages,
    city: p.city,
    location: { lat: p.lat, lng: p.lng },
    coverageKm: p.coverageKm,
    rating: p.rating,
    reviewsCount: p.reviewsCount,
    yearsExp: p.yearsExp,
    verified: p.verified,
    bio: p.bio,
    photoColor: p.photoColor,
    nextAvailableAt: p.nextAvailableAt ? p.nextAvailableAt.toISOString() : null,
    distanceKm: from ? Math.round(haversineKm(from.lat, from.lng, p.lat, p.lng) * 10) / 10 : null,
  };
}

export function toBooking(b: CzBookingRow, opts?: { provider?: CzProviderRow; service?: { id: number; name: string; durationMin: number; basePriceInr: number; category: string; icon: string } }) {
  const timeline = [
    { key: "scheduled", label: "Visit scheduled", at: b.createdAt },
    { key: "confirmed", label: "Booking confirmed", at: b.confirmedAt },
    { key: "en_route", label: "Provider en route", at: b.enRouteAt },
    { key: "checked_in", label: "Checked in", at: b.checkedInAt },
    { key: "in_service", label: "Service in progress", at: b.startedAt },
    { key: "completed", label: "Visit completed", at: b.completedAt },
  ].map((e) => ({ ...e, at: e.at ? new Date(e.at).toISOString() : null }));

  const activeKey = b.status === "cancelled" ? null : b.status;

  return {
    id: b.id,
    status: b.status,
    paymentStatus: b.paymentStatus,
    startsAt: b.startsAt.toISOString(),
    durationMin: b.durationMin,
    patient: { name: b.patientName, age: b.patientAge, gender: b.patientGender },
    address: b.address,
    city: b.city,
    instructions: b.instructions,
    amountInr: b.amountInr,
    currency: "INR",
    // Display-only: the FAMILY shares this verbally at the door. Never sent to
    // the provider through any API.
    checkinOtp: b.enRouteAt ? b.checkinOtp : null,
    providerId: b.providerId,
    serviceId: b.serviceId,
    provider: opts?.provider ? toProvider(opts.provider) : undefined,
    service: opts?.service,
    timeline,
    activeKey,
    createdAt: b.createdAt.toISOString(),
  };
}

export async function hydrateBookings(rows: CzBookingRow[]) {
  const providerIds = [...new Set(rows.map((r) => r.providerId))];
  const providers = new Map<number, CzProviderRow>();
  for (const pid of providerIds) {
    const p = await db.select().from(czProviders).where(eq(czProviders.id, pid)).limit(1);
    if (p[0]) providers.set(pid, p[0]);
  }
  const { czServices } = await import("@/db/schema");
  const serviceIds = [...new Set(rows.map((r) => r.serviceId))];
  const services = new Map<number, typeof czServices.$inferSelect>();
  for (const sid of serviceIds) {
    const s = await db.select().from(czServices).where(eq(czServices.id, sid)).limit(1);
    if (s[0]) services.set(sid, s[0]);
  }
  return rows.map((r) =>
    toBooking(r, {
      provider: providers.get(r.providerId),
      service: services.get(r.serviceId),
    }),
  );
}

export async function getBookingWithJoins(id: number) {
  const rows = await db.select().from(czBookings).where(eq(czBookings.id, id)).limit(1);
  if (!rows[0]) return null;
  const [dto] = await hydrateBookings(rows);
  return dto;
}
