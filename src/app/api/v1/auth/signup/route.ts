import { ensureCarezoaSeed } from "@/server/carezoa/seed";
import { createSignupOtp, hasActiveOtp, isDevMode, phoneExists } from "@/server/carezoa/otpService";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/auth/signup
 * Request OTP for new user signup
 * 
 * Flow:
 * 1. Validate phone number and user details
 * 2. Check if phone already exists (should NOT exist for signup)
 * 3. Generate and store OTP with user details
 * 4. Send OTP (or return devCode in dev mode)
 * 
 * Request: {
 *   phone: string,
 *   name: string,
 *   dob?: string,
 *   gender?: string,
 *   city?: string,
 *   address?: string
 * }
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
    const name = String(body.name ?? "").trim();
    const dob = body.dob ? String(body.dob) : undefined;
    const gender = body.gender ? String(body.gender) : undefined;
    const city = body.city ? String(body.city).trim() : undefined;
    const address = body.address ? String(body.address).trim() : undefined;
    
    // Validate phone number
    if (!/^\+?\d{10,15}$/.test(phone)) {
      return Response.json(
        { error: "Valid phone number required (10-15 digits with optional + prefix)" },
        { status: 400 }
      );
    }
    
    // Validate name (required for signup)
    if (!name || name.length < 2) {
      return Response.json(
        { error: "Name is required (minimum 2 characters)" },
        { status: 400 }
      );
    }
    
    // Validate gender if provided
    if (gender && !['M', 'F', 'O'].includes(gender)) {
      return Response.json(
        { error: "Gender must be M (Male), F (Female), or O (Other)" },
        { status: 400 }
      );
    }
    
    // Check if phone already exists (signup is for NEW users only)
    const exists = await phoneExists(phone);
    if (exists) {
      return Response.json(
        { error: "Phone number already registered. Please login instead." },
        { status: 409 } // Conflict
      );
    }
    
    // Rate limiting: check if OTP already exists
    if (hasActiveOtp(phone)) {
      return Response.json(
        { error: "OTP already sent. Please wait before requesting a new one" },
        { status: 429 }
      );
    }
    
    // Generate and store OTP with signup data
    const otpData = createSignupOtp(phone, {
      name,
      dob,
      gender,
      city,
      address,
    });
    
    const response: any = {
      requestId: otpData.requestId,
      expiresInSec: otpData.expiresInSec,
    };
    
    if (isDevMode()) {
      response.devCode = otpData.code;
      console.log(`[DEV] Signup OTP for ${phone}: ${otpData.code}`);
    } else {
      // Production: Send OTP via SMS
      console.log(`[PROD] Would send OTP ${otpData.code} to ${phone} via SMS`);
    }
    
    return Response.json(response);
  } catch (e: any) {
    console.error("[v1/auth/signup]", e);
    return Response.json(
      { error: e.message || "Failed to send OTP" },
      { status: 500 }
    );
  }
}
