// ============================================================================
// Core Type Definitions for Admin Console
// ============================================================================

export type UserRole = 'patient' | 'provider' | 'family_member' | 'admin' | 'support_agent';

export type BookingStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'en_route'
  | 'checked_in'
  | 'in_service'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'disputed';

export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded';

export type PayoutStatus = 'payout_ready' | 'processing' | 'paid' | 'on_hold';

export type VerificationStatus = 'unverified' | 'pending_review' | 'verified' | 'suspended';

export type CredentialStatus = 'pending_review' | 'verified' | 'rejected';

export type IncidentType = 'safety' | 'no_show' | 'misconduct' | 'other';

export type IncidentStatus = 'open' | 'investigating' | 'resolved' | 'dismissed';

export type TicketStatus = 'open' | 'in_progress' | 'resolved';

export type FlagSeverity = 'low' | 'medium' | 'high';

// ============================================================================
// User & Auth
// ============================================================================

export interface User {
  id: number;
  phone: string;
  email?: string;
  role: UserRole;
  is_active: boolean;
  mfa_enabled: boolean;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  access_expires_at: number;
  refresh_expires_at: number;
}

// ============================================================================
// Provider
// ============================================================================

export interface Provider {
  id: number;
  user_id?: number;
  display_name: string;
  title: string;
  qualifications: string[];
  languages: string[];
  city: string;
  lat: number;
  lng: number;
  coverage_km: number;
  bio: string;
  years_exp: number;
  rating_avg: number;
  rating_count: number;
  acceptance_rate: number;
  cancellation_rate: number;
  verification_status: VerificationStatus;
  photo_color: string;
  created_at?: string;
}

export interface ProviderCredential {
  id: number;
  provider_id: number;
  doc_type: 'license' | 'id_proof' | 'certificate';
  s3_key: string;
  status: CredentialStatus;
  verified_at?: string;
  expires_at?: string;
  created_at?: string;
}

// ============================================================================
// Booking
// ============================================================================

export interface PatientSnapshot {
  name: string;
  age: number;
  gender: 'F' | 'M' | 'O';
}

export interface TimelineEvent {
  key: string;
  label: string;
  at?: string;
}

export interface Booking {
  id: number;
  status: BookingStatus;
  payment_status: PaymentStatus;
  starts_at: string;
  duration_min: number;
  patient: PatientSnapshot;
  address: string;
  city: string;
  instructions: string;
  amount_inr: number;
  currency: string;
  provider_id: number;
  service_id: number;
  timeline: TimelineEvent[];
  provider?: Provider;
  service?: Service;
  created_at: string;
}

// ============================================================================
// Service Catalogue
// ============================================================================

export interface Service {
  id: number;
  category: string;
  name: string;
  description: string;
  duration_min: number;
  base_price_inr: number;
  icon: string;
  active: boolean;
}

// ============================================================================
// Payment & Payout
// ============================================================================

export interface Payment {
  id: number;
  booking_id: number;
  method_id?: number;
  gateway: string;
  gateway_ref: string;
  amount_inr: number;
  currency: string;
  status: PaymentStatus;
  created_at: string;
}

export interface Payout {
  id: number;
  provider_id: number;
  booking_id: number;
  amount_inr: number;
  platform_fee_inr: number;
  status: PayoutStatus;
  ready_at?: string;
  paid_at?: string;
  transfer_ref?: string;
  created_at?: string;
}

// ============================================================================
// Incidents & Support
// ============================================================================

export interface Incident {
  id: number;
  booking_id: number;
  reporter_user_id: number;
  type: IncidentType;
  description: string;
  status: IncidentStatus;
  resolution?: string;
  created_at: string;
}

export interface Ticket {
  id: number;
  user_id: number;
  subject: string;
  body: string;
  status: TicketStatus;
  assigned_to?: number;
  created_at: string;
}

// ============================================================================
// Fraud & Compliance
// ============================================================================

export interface FlaggedEvent {
  id: number;
  thread_id: number;
  severity: FlagSeverity;
  patterns: string[];
  body: string;
  created_at: string;
  reviewed_by?: number;
  reviewed_at?: string;
}

export interface AuditLog {
  id: number;
  actor_user_id?: number;
  actor_role: string;
  entity_type: string;
  entity_id: number;
  action: string;
  from_state?: string;
  to_state?: string;
  meta: Record<string, any>;
  created_at: string;
}

// ============================================================================
// Analytics
// ============================================================================

export interface AnalyticsOverview {
  bookings_by_status: Record<BookingStatus, number>;
  gmv_inr: number;
  audit_events_by_entity: Record<string, number>;
}

export interface QualityMetrics {
  on_time_arrival_rate: number;
  booking_acceptance_rate: number;
  cancellation_rate: number;
  patient_rating: number;
  complaint_rate: number;
  report_completion_rate: number;
  repeat_booking_rate: number;
  incident_rate: number;
}

// ============================================================================
// API Responses
// ============================================================================

export interface ApiError {
  error: string;
  detail?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}
