// ============================================================================
// Provider App Type Definitions
// Extensible for nurses, doctors, physiotherapists, lab technicians, etc.
// ============================================================================

export type ProviderType = 'nurse' | 'doctor' | 'physiotherapist' | 'lab_technician' | 'attendant';

export type VerificationStatus = 'unverified' | 'pending_review' | 'verified' | 'suspended';

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

export type IncidentType = 'safety' | 'no_show' | 'misconduct' | 'other';

export type IncidentStatus = 'open' | 'investigating' | 'resolved' | 'dismissed';

export type CredentialType = 'license' | 'id_proof' | 'certificate';

export type CredentialStatus = 'pending_review' | 'verified' | 'rejected';

// ============================================================================
// User & Auth
// ============================================================================

export interface User {
  id: number;
  phone: string;
  email?: string;
  role: 'patient' | 'provider' | 'family_member' | 'admin' | 'support_agent';
  is_active: boolean;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  access_expires_at: string;
}

export interface OtpRequestResponse {
  request_id: number;
  expires_in_sec: number;
  dev_code?: string;
}

export interface OtpVerifyResponse extends AuthTokens {
  is_new_user: boolean;
}

// ============================================================================
// Provider Profile
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
}

export interface ProviderCredential {
  id: number;
  provider_id: number;
  doc_type: CredentialType;
  s3_key: string;
  status: CredentialStatus;
  verified_at?: string;
  expires_at?: string;
}

export interface CredentialUploadResponse {
  credential_id: number;
  upload_url: string;
  expires_in_sec: number;
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
}

export interface ProviderServiceOffering {
  id: number;
  provider_id: number;
  service_id: number;
  price_inr: number;
  active: boolean;
  service?: Service;
}

// ============================================================================
// Availability
// ============================================================================

export interface AvailabilityWindow {
  weekday: number; // 0=Mon, 6=Sun
  start_min: number; // minutes from midnight
  end_min: number;
}

// ============================================================================
// Bookings
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
  checkin_otp?: string; // Only visible to patient/family, NOT provider
  provider_id: number;
  service_id: number;
  timeline: TimelineEvent[];
  provider?: Provider;
  service?: Service;
  created_at: string;
}

// ============================================================================
// Service Reports
// ============================================================================

export interface ServiceReport {
  id: number;
  booking_id: number;
  summary: string;
  vitals: Record<string, string>;
  notes: string;
  submitted_at: string;
}

export interface ServiceReportInput {
  summary: string;
  vitals: Record<string, string>;
  notes?: string;
}

// ============================================================================
// Payouts & Earnings
// ============================================================================

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
}

// ============================================================================
// Reviews & Ratings
// ============================================================================

export interface Review {
  id: number;
  booking_id: number;
  patient_id: number;
  provider_id: number;
  rating: number;
  text: string;
  author_label: string;
  created_at: string;
}

// ============================================================================
// Incidents
// ============================================================================

export interface Incident {
  id: number;
  booking_id: number;
  reporter_user_id: number;
  type: IncidentType;
  description: string;
  status: IncidentStatus;
  resolution?: string;
}

export interface IncidentReportInput {
  type: IncidentType;
  description: string;
}

// ============================================================================
// Communication
// ============================================================================

export interface Message {
  id: number;
  sender: 'patient' | 'provider';
  author_name: string;
  body: string;
  flagged: boolean;
  created_at: string;
}

export interface MaskedCall {
  call_id: string;
  masked_number: string;
  expires_at: string;
}

// ============================================================================
// Quality & Analytics
// ============================================================================

export interface QualityScorecard {
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
// Onboarding
// ============================================================================

export interface OnboardingData {
  // Step 1: Basic Info
  display_name?: string;
  title?: string;
  qualifications?: string[];
  years_exp?: number;
  languages?: string[];
  
  // Step 2: Services & Area
  services?: number[]; // service IDs
  city?: string;
  lat?: number;
  lng?: number;
  coverage_km?: number;
  
  // Step 3: Documents
  credentials?: {
    license?: string;
    id_proof?: string;
    certificates?: string[];
  };
  
  // Step 4: Agreement
  agreement_accepted?: boolean;
}

export interface OnboardingState {
  current_step: number;
  data: OnboardingData;
  is_complete: boolean;
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
