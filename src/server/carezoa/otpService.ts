/**
 * OTP Service for phone number verification
 * Enhanced to store user details during signup process
 */

interface OtpRecord {
  phone: string;
  code: string;
  expiresAt: number;
  attempts: number;
  // Store user details during signup (before account creation)
  signupData?: {
    name: string;
    dob?: string;
    gender?: string;
    city?: string;
    address?: string;
  };
  purpose: 'login' | 'signup'; // Distinguish between login and signup
}

// In-memory storage (use Redis in production)
const otpStore = new Map<string, OtpRecord>();

// Configuration
const OTP_LENGTH = 6;
const OTP_EXPIRY_SECONDS = 300; // 5 minutes
const MAX_ATTEMPTS = 5;
const CLEANUP_INTERVAL_MS = 60000; // Clean up expired OTPs every minute

/**
 * Generate a random 6-digit OTP
 */
export function generateOtp(): string {
  let otp = '';
  for (let i = 0; i < OTP_LENGTH; i++) {
    otp += Math.floor(Math.random() * 10).toString();
  }
  return otp;
}

/**
 * Store OTP for signup (with user details)
 */
export function createSignupOtp(
  phone: string,
  signupData: {
    name: string;
    dob?: string;
    gender?: string;
    city?: string;
    address?: string;
  }
): { code: string; expiresInSec: number; requestId: string } {
  const normalizedPhone = phone.replace(/[\s-]/g, '');
  
  // Validate required fields
  if (!signupData.name || signupData.name.trim().length < 2) {
    throw new Error('Name is required (minimum 2 characters)');
  }
  
  const code = generateOtp();
  const expiresAt = Date.now() + (OTP_EXPIRY_SECONDS * 1000);
  const requestId = `otp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  
  otpStore.set(normalizedPhone, {
    phone: normalizedPhone,
    code,
    expiresAt,
    attempts: 0,
    signupData,
    purpose: 'signup',
  });
  
  return {
    code,
    expiresInSec: OTP_EXPIRY_SECONDS,
    requestId,
  };
}

/**
 * Store OTP for login (no details needed)
 */
export function createLoginOtp(phone: string): { code: string; expiresInSec: number; requestId: string } {
  const normalizedPhone = phone.replace(/[\s-]/g, '');
  
  const code = generateOtp();
  const expiresAt = Date.now() + (OTP_EXPIRY_SECONDS * 1000);
  const requestId = `otp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  
  otpStore.set(normalizedPhone, {
    phone: normalizedPhone,
    code,
    expiresAt,
    attempts: 0,
    purpose: 'login',
  });
  
  return {
    code,
    expiresInSec: OTP_EXPIRY_SECONDS,
    requestId,
  };
}

/**
 * Verify OTP and return stored signup data (if signup)
 */
export function verifyOtp(phone: string, code: string): { 
  valid: boolean; 
  error?: string;
  signupData?: OtpRecord['signupData'];
  purpose?: 'login' | 'signup';
} {
  const normalizedPhone = phone.replace(/[\s-]/g, '');
  const record = otpStore.get(normalizedPhone);
  
  if (!record) {
    return { valid: false, error: 'OTP not found or expired' };
  }
  
  if (Date.now() > record.expiresAt) {
    otpStore.delete(normalizedPhone);
    return { valid: false, error: 'OTP expired' };
  }
  
  if (record.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(normalizedPhone);
    return { valid: false, error: 'Too many attempts. Please request a new OTP' };
  }
  
  record.attempts++;
  
  if (record.code !== code) {
    return { valid: false, error: 'Incorrect OTP' };
  }
  
  // Success - extract data before deleting
  const signupData = record.signupData;
  const purpose = record.purpose;
  otpStore.delete(normalizedPhone);
  
  return { valid: true, signupData, purpose };
}

/**
 * Check if phone has active OTP (for rate limiting)
 */
export function hasActiveOtp(phone: string): boolean {
  const normalizedPhone = phone.replace(/[\s-]/g, '');
  const record = otpStore.get(normalizedPhone);
  
  if (!record) return false;
  if (Date.now() > record.expiresAt) {
    otpStore.delete(normalizedPhone);
    return false;
  }
  
  return true;
}

/**
 * Check if phone number exists in database
 */
export async function phoneExists(phone: string): Promise<boolean> {
  const { db } = await import('@/db');
  const { czPatients } = await import('@/db/schema');
  const { eq } = await import('drizzle-orm');
  
  const normalizedPhone = phone.replace(/[\s-]/g, '');
  const [existing] = await db
    .select()
    .from(czPatients)
    .where(eq(czPatients.phone, normalizedPhone))
    .limit(1);
  
  return !!existing;
}

/**
 * Clean up expired OTPs
 */
function cleanupExpired() {
  const now = Date.now();
  for (const [phone, record] of otpStore.entries()) {
    if (now > record.expiresAt) {
      otpStore.delete(phone);
    }
  }
}

// Start cleanup interval
setInterval(cleanupExpired, CLEANUP_INTERVAL_MS);

// Dev mode: allow hardcoded OTP for testing
export const DEV_OTP = '123456';
export function isDevMode(): boolean {
  return process.env.NODE_ENV === 'development';
}
