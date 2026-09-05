/**
 * OTP Service for phone number verification
 * In production, use Redis or database for distributed storage
 * For now, using in-memory storage (single server only)
 */

interface OtpRecord {
  phone: string;
  code: string;
  expiresAt: number;
  attempts: number;
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
 * Store OTP for a phone number
 * Returns the generated OTP (for dev mode - in production, send via SMS)
 */
export function createOtp(phone: string): { code: string; expiresInSec: number; requestId: string } {
  // Normalize phone number
  const normalizedPhone = phone.replace(/[\s-]/g, '');
  
  // Generate new OTP
  const code = generateOtp();
  const expiresAt = Date.now() + (OTP_EXPIRY_SECONDS * 1000);
  const requestId = `otp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  
  // Store OTP
  otpStore.set(normalizedPhone, {
    phone: normalizedPhone,
    code,
    expiresAt,
    attempts: 0,
  });
  
  return {
    code,
    expiresInSec: OTP_EXPIRY_SECONDS,
    requestId,
  };
}

/**
 * Verify OTP for a phone number
 * Returns true if valid, false otherwise
 */
export function verifyOtp(phone: string, code: string): { valid: boolean; error?: string } {
  const normalizedPhone = phone.replace(/[\s-]/g, '');
  const record = otpStore.get(normalizedPhone);
  
  // Check if OTP exists
  if (!record) {
    return { valid: false, error: 'OTP not found or expired' };
  }
  
  // Check if expired
  if (Date.now() > record.expiresAt) {
    otpStore.delete(normalizedPhone);
    return { valid: false, error: 'OTP expired' };
  }
  
  // Check attempts
  if (record.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(normalizedPhone);
    return { valid: false, error: 'Too many attempts. Please request a new OTP' };
  }
  
  // Increment attempts
  record.attempts++;
  
  // Verify code
  if (record.code !== code) {
    return { valid: false, error: 'Incorrect OTP' };
  }
  
  // Success - delete OTP (one-time use)
  otpStore.delete(normalizedPhone);
  return { valid: true };
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
