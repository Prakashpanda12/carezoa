/**
 * JWT Service for authentication tokens
 * In production, use a proper JWT library like 'jsonwebtoken'
 * For now, using a simple token format with signature
 */

import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'carezoa-dev-secret-change-in-production';
const JWT_EXPIRY_HOURS = 24 * 7; // 7 days

interface TokenPayload {
  patientId: number;
  phone: string;
  iat: number;
  exp: number;
}

/**
 * Generate a JWT-like token
 * Format: base64(header).base64(payload).signature
 */
export function generateToken(patientId: number, phone: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = {
    patientId,
    phone,
    iat: now,
    exp: now + (JWT_EXPIRY_HOURS * 3600),
  };
  
  // Simple base64 encoding (in production, use proper JWT library)
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  // Create signature
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payloadStr}`)
    .digest('base64url');
  
  return `${header}.${payloadStr}.${signature}`;
}

/**
 * Verify and decode a token
 * Returns payload if valid, null if invalid
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [header, payloadStr, signature] = parts;
    
    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payloadStr}`)
      .digest('base64url');
    
    if (signature !== expectedSignature) {
      return null;
    }
    
    // Decode payload
    const payload: TokenPayload = JSON.parse(
      Buffer.from(payloadStr, 'base64url').toString('utf-8')
    );
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return null;
    }
    
    return payload;
  } catch (e) {
    return null;
  }
}

/**
 * Extract patient ID from token
 */
export function getPatientIdFromToken(token: string): number | null {
  const payload = verifyToken(token);
  return payload?.patientId || null;
}
