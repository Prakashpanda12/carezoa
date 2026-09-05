import { ensureCarezoaSeed } from "@/server/carezoa/seed";
import { createOtp, hasActiveOtp, isDevMode, DEV_OTP } from "@/server/carezoa/otpService";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/auth/otp/request
 * Request OTP for phone number verification
 * 
 * Request body: { phone: string }
 * Response: { requestId: string, expiresInSec: number, devCode?: string }
 * 
 * In production:
 * - devCode is NEVER returned (OTP sent via SMS)
 * - Rate limiting should be implemented
 * - OTP should be sent via SMS provider (Twilio, MSG91, etc.)
 */
export async function POST(req: Request) {
  try {
    await ensureCarezoaSeed();
    const body = await req.json();
    const phone = String(body.phone ?? "");
    
    // Validate phone number format
    const normalizedPhone = phone.replace(/[\s-]/g, "");
    if (!/^\+?\d{10,15}$/.test(normalizedPhone)) {
      return Response.json(
        { error: "Valid phone number required (10-15 digits with optional + prefix)" },
        { status: 400 }
      );
    }
    
    // Rate limiting: check if OTP already exists
    if (hasActiveOtp(normalizedPhone)) {
      return Response.json(
        { error: "OTP already sent. Please wait before requesting a new one" },
        { status: 429 }
      );
    }
    
    // Generate and store OTP
    const otpData = createOtp(normalizedPhone);
    
    // In development mode, return the OTP for testing
    // In production, NEVER return the OTP - send via SMS instead
    const response: any = {
      requestId: otpData.requestId,
      expiresInSec: otpData.expiresInSec,
    };
    
    if (isDevMode()) {
      response.devCode = otpData.code; // For testing only!
      console.log(`[DEV] OTP for ${normalizedPhone}: ${otpData.code}`);
    } else {
      // Production: Send OTP via SMS
      // TODO: Integrate with SMS provider (Twilio, MSG91, etc.)
      // await sendSms(normalizedPhone, `Your Carezoa OTP is: ${otpData.code}`);
      console.log(`[PROD] Would send OTP ${otpData.code} to ${normalizedPhone} via SMS`);
    }
    
    return Response.json(response);
  } catch (e) {
    console.error("[v1/otp/request]", e);
    return Response.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
