import { Platform } from "react-native";
import type {
  Booking,
  CarePackage,
  CareRecord,
  ChatMessage,
  FamilyMember,
  PatientProfile,
  PaymentIntent,
  PaymentMethod,
  ProviderDetail,
  ProviderSummary,
  Service,
  Ticket,
} from "../types/api";

// Next.js backend runs on port 3000 by default
// For Android emulator: 10.0.2.2 is the special alias for localhost
// For physical devices: use your machine's LAN IP address via EXPO_PUBLIC_API_URL
const DEFAULT_BASE =
  Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";

export const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_BASE;
const V1 = `${API_BASE}/api/v1`;

let authToken: string | null = null;
export function setAuthToken(token: string | null) {
  authToken = token;
}

/**
 * Callback invoked when the API returns 401 (token expired).
 * The auth store wires this up to clear the session and redirect to login.
 */
let onUnauthorized: (() => void) | null = null;
export function setOnUnauthorized(cb: () => void) {
  onUnauthorized = cb;
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${V1}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  // BUG-C03 fix: handle token expiry / unauthorized
  if (res.status === 401) {
    onUnauthorized?.();
    throw new ApiError(401, "Session expired. Please sign in again.");
  }

  if (!res.ok) {
    // SEC-012 fix: don't leak server error details to users
    const body = await res.json().catch(() => null);
    const userMessage =
      res.status === 404
        ? "Resource not found."
        : res.status === 403
          ? "You don't have permission for this action."
          : res.status >= 500
            ? "Server error. Please try again shortly."
            : body?.error ?? `Request failed. Please try again.`;
    throw new ApiError(res.status, userMessage);
  }
  return (await res.json()) as T;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Absolute URL for WebView-hosted pages (checkout). */
export const absoluteUrl = (path: string) =>
  path.startsWith("http") ? path : `${API_BASE}${path}`;

export const api = {
  // auth
  otpRequest: (phone: string) =>
    request<{ requestId: string; expiresInSec: number; devCode: string }>(
      "/auth/otp/request",
      { method: "POST", body: JSON.stringify({ phone }) },
    ),
  otpVerify: (phone: string, code: string) =>
    request<{ access_token: string; refresh_token: string; token_type: string; access_expires_at: number; is_new_user: boolean }>(
      "/auth/otp/verify",
      { method: "POST", body: JSON.stringify({ phone, code }) },
    ),
  getProfile: () => request<PatientProfile>("/profile"),
  patchProfile: (patch: Partial<PatientProfile>) =>
    request<PatientProfile>("/profile", { method: "PATCH", body: JSON.stringify(patch) }),

  // catalog
  getServices: () => request<{ categories: string[]; items: Service[] }>("/services"),
  getProviders: (params?: { q?: string; city?: string }) => {
    const qs = new URLSearchParams();
    if (params?.q) qs.set("q", params.q);
    if (params?.city) qs.set("city", params.city);
    return request<{ items: ProviderSummary[] }>(`/providers?${qs.toString()}`);
  },
  getProvider: (id: number | string) => request<ProviderDetail>(`/providers/${id}`),

  // bookings
  getBookings: (scope: "upcoming" | "past" | "all") =>
    request<{ items: Booking[] }>(`/bookings?scope=${scope}`),
  getBooking: (id: number | string) => request<Booking>(`/bookings/${id}`),
  createBooking: (payload: {
    providerId: number;
    serviceId: number;
    startsAt: string;
    patientName: string;
    patientAge: number;
    patientGender: string;
    address: string;
    city: string;
    instructions?: string;
  }) => request<{ booking: Booking }>("/bookings", { method: "POST", body: JSON.stringify(payload) }),
  patchBooking: (id: number | string, body: { action: "cancel" | "reschedule"; startsAt?: string }) =>
    request<Booking>(`/bookings/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

  // chat + calls
  getMessages: (bookingId: number | string) =>
    request<{ items: ChatMessage[] }>(`/bookings/${bookingId}/messages`),
  sendMessage: (bookingId: number | string, body: string) =>
    request<{ sent: ChatMessage; reply: ChatMessage }>(`/bookings/${bookingId}/messages`, {
      method: "POST",
      body: JSON.stringify({ body }),
    }),
  maskedCall: (bookingId: number | string) =>
    request<{ callId: string; maskedNumber: string; expiresAt: string; note: string }>(
      "/calls/masked",
      { method: "POST", body: JSON.stringify({ bookingId }) },
    ),

  // payments
  createPaymentIntent: (bookingId: number, methodId: number | null) =>
    request<PaymentIntent>("/payments", {
      method: "POST",
      body: JSON.stringify({ bookingId, methodId }),
    }),

  // records, family, packages, support, methods
  getRecords: () => request<{ items: CareRecord[] }>("/records"),
  getFamily: () => request<{ items: FamilyMember[] }>("/family"),
  inviteFamily: (payload: {
    name: string;
    relation: string;
    phone: string;
    accessScope: { viewVisits: boolean; viewRecords: boolean; chat: boolean };
  }) => request<{ member: FamilyMember }>("/family", { method: "POST", body: JSON.stringify(payload) }),
  patchFamily: (id: number, body: unknown) =>
    request<{ member: FamilyMember }>(`/family/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  getPackages: () => request<{ items: CarePackage[] }>("/packages"),
  subscribePackage: (packageId: number) =>
    request<{ subscription: { id: number; packageId: number; status: string } }>(
      `/packages/${packageId}`,
      { method: "POST" },
    ),
  getTickets: () => request<{ items: Ticket[] }>("/tickets"),
  createTicket: (subject: string, body: string) =>
    request<{ ticket: Ticket }>("/tickets", { method: "POST", body: JSON.stringify({ subject, body }) }),
  getPaymentMethods: () => request<{ items: PaymentMethod[] }>("/payment-methods"),
  addPaymentMethod: (type: "card" | "upi", detail: string) =>
    request<{ method: PaymentMethod }>("/payment-methods", {
      method: "POST",
      body: JSON.stringify({ type, detail }),
    }),
  deletePaymentMethod: (id: number) =>
    request<{ ok: boolean }>(`/payment-methods/${id}`, { method: "DELETE" }),

  /** MOCK-ONLY: simulates the provider app advancing the visit lifecycle. */
  simAdvance: (bookingId: number | string) =>
    request<Booking>("/sim/advance", { method: "POST", body: JSON.stringify({ bookingId }) }),
};
