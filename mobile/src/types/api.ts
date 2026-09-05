/**
 * Types mirroring the CAREZOA /api/v1 contract (see API.md / GET /api/v1/docs).
 * In the full pipeline these are generated from the OpenAPI schema.
 */

export interface PatientProfile {
  id: number;
  name: string;
  phone: string;
  dob: string;
  gender: string;
  city: string;
  address: string;
  onboardingDone: boolean;
}

export interface Service {
  id: number;
  category: string;
  name: string;
  description: string;
  durationMin: number;
  basePriceInr: number;
  currency: string;
  icon: string;
}

export interface ProviderSummary {
  id: number;
  name: string;
  title: string;
  qualifications: string[];
  languages: string[];
  city: string;
  location: { lat: number; lng: number };
  coverageKm: number;
  rating: number;
  reviewsCount: number;
  yearsExp: number;
  verified: boolean;
  bio: string;
  photoColor: string;
  nextAvailableAt: string | null;
  distanceKm: number | null;
  // Contract note: phone/email/handles are NEVER part of this payload.
}

export interface ProviderDetail extends ProviderSummary {
  services: { id: number; name: string; durationMin: number; basePriceInr: number; currency: string }[];
  reviews: { id: number; authorName: string; rating: number; text: string; createdAt: string }[];
}

export type VisitStatus =
  | "scheduled"
  | "confirmed"
  | "en_route"
  | "checked_in"
  | "in_service"
  | "completed"
  | "cancelled";

export interface TimelineEvent {
  key: string;
  label: string;
  at: string | null;
}

export interface Booking {
  id: number;
  status: VisitStatus;
  paymentStatus: "unpaid" | "pending" | "paid" | "failed";
  startsAt: string;
  durationMin: number;
  patient: { name: string; age: number; gender: string };
  address: string;
  city: string;
  instructions: string;
  amountInr: number;
  currency: string;
  /** Display-only: family shares verbally at the door. */
  checkinOtp: string | null;
  providerId: number;
  serviceId: number;
  provider?: ProviderSummary;
  service?: { id: number; name: string; durationMin: number; basePriceInr: number; category: string; icon: string };
  timeline: TimelineEvent[];
  createdAt: string;
}

export interface ChatMessage {
  id: number;
  bookingId: number;
  sender: "patient" | "provider";
  authorName: string;
  body: string;
  createdAt: string;
}

export interface CareRecord {
  id: number;
  booking: Booking;
  summary: string;
  vitals: Record<string, string>;
  notes: string;
  createdAt: string;
}

export interface FamilyMember {
  id: number;
  name: string;
  relation: string;
  phone: string;
  accessScope: { viewVisits: boolean; viewRecords: boolean; chat: boolean };
  inviteStatus: "pending" | "active" | "revoked";
  createdAt: string;
}

export interface CarePackage {
  id: number;
  name: string;
  description: string;
  visitsPerMonth: number;
  pricePerMonthInr: number;
  currency: string;
  includes: string[];
  bestFor: string;
  subscribed: boolean;
}

export interface Ticket {
  id: number;
  subject: string;
  body: string;
  status: "open" | "in_progress" | "resolved";
  createdAt: string;
}

export interface PaymentMethod {
  id: number;
  type: "card" | "upi";
  label: string;
  detail: string;
}

export interface PaymentIntent {
  paymentId: number;
  bookingId: number;
  amountInr: number;
  currency: string;
  checkoutUrl: string;
  status: string;
}
