import { ensureCarezoaSeed } from "@/server/carezoa/seed";
import { createLoginOtp, hasActiveOtp, isDevMode, phoneExists } from "@/server/carezoa/otpService";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/auth/login
 * Request OTP for existing user login
 * 
 * Flow:
 * 1. Validate phone number
 * 2. Check if phone exists (MUST exist for login)
 * 3. Generate and store OTP
 * 4. Send OTP (or return devCode in dev mode)
 * 
 * Request: { phone: string }
 * 
 * Response: {
 *   requestId: string,
 *   expiresInSec: number,
 *   devCode?: string  // Dev mode only
 * }
 */
export async function POST(req: Request) {
  try {
    await ensureCarezoaSeed();
    const body = await req.json();
    
    const phone = String(body.phone ?? "").replace(/[\s-]/g, "");
    
    // Validate phone number
    if (!/^\+?\d{10,15}$/.test(phone)) {
      return Response.json(
        { error: "Valid phone number required (10-15 digits with optional + prefix)" },
        { status: 400 }
      );
    }
    
    // Check if phone exists (login is for EXISTING users only)
    const exists = await phoneExists(phone);
    if (!exists) {
      return Response.json(
        { error: "Phone number not registered. Please signup first." },
        { status: 404 }
      );
    }
    
    // Rate limiting: check if OTP already exists
    if (hasActiveOtp(phone)) {
      return Response.json(
        { error: "OTP already sent. Please wait before requesting a new one" },
        { status: 429 }
      );
    }
    
    // Generate and store OTP
    const otpData = createLoginOtp(phone);
    
    const response: any = {
      requestId: otpData.requestId,
      expiresInSec: otpData.expiresInSec,
    };
    
    if (isDevMode()) {
      response.devCode = otpData.code;
      console.log(`[DEV] Login OTP for ${phone}: ${otpData.code}`);
    } else {
      // Production: Send OTP via SMS
      console.log(`[PROD] Would send OTP ${otpData.code} to ${phone} via SMS`);
    }
    
    return Response.json(response);
  } catch (e: any) {
    console.error("[v1/auth/login]", e);
    return Response.json(
      { error: e.message || "Failed to send OTP" },
      { status: 500 }
    );
  }
}
