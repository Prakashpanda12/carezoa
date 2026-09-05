import { db } from "@/db";
import { czPatients } from "@/db/schema";
import { ensureCarezoaSeed } from "@/server/carezoa/seed";
import { verifyOtp, isDevMode, DEV_OTP } from "@/server/carezoa/otpService";
import { generateToken } from "@/server/carezoa/jwtService";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/auth/login/verify
 * Verify OTP and login existing user
 * 
 * Flow:
 * 1. Verify OTP
 * 2. Retrieve existing patient
 * 3. Generate JWT token
 * 4. Return token and patient data
 * 
 * Request: { phone: string, code: string }
 * 
 * Response: {
 *   token: string,
 *   isNewUser: false,
 *   patient: Patient
 * }
 */
export async function POST(req: Request) {
  try {
    await ensureCarezoaSeed();
    const body = await req.json();
    const phone = String(body.phone ?? "").replace(/[\s-]/g, "");
    const code = String(body.code ?? "");
    
    if (!phone || !code) {
      return Response.json(
        { error: "Phone number and OTP code are required" },
        { status: 400 }
      );
    }
    
    // Verify OTP
    const otpResult = isDevMode() && code === DEV_OTP
      ? { valid: true, purpose: 'login' as const }
      : verifyOtp(phone, code);
    
    if (!otpResult.valid) {
      return Response.json(
        { error: otpResult.error || "Invalid OTP" },
        { status: 401 }
      );
    }
    
    // Check if this was a login OTP
    if (otpResult.purpose !== 'login') {
      return Response.json(
        { error: "Invalid OTP for login. Please request a new login OTP." },
        { status: 400 }
      );
    }
    
    // Find existing patient
    const [patient] = await db
      .select()
      .from(czPatients)
      .where(eq(czPatients.phone, phone))
      .limit(1);
    
    if (!patient) {
      return Response.json(
        { error: "Phone number not registered. Please signup first." },
        { status: 404 }
      );
    }
    
    console.log(`[AUTH] Existing patient logged in: ${patient.id} (${phone})`);
    
    // Generate JWT token
    const token = generateToken(patient.id, phone);
    
    return Response.json({
      token,
      isNewUser: false,
      patient: {
        id: patient.id,
        name: patient.name,
        phone: patient.phone,
        dob: patient.dob,
        gender: patient.gender,
        city: patient.city,
        address: patient.address,
        onboardingDone: patient.onboardingDone,
      },
    });
  } catch (e) {
    console.error("[v1/auth/login/verify]", e);
    return Response.json({ error: "Login verification failed" }, { status: 500 });
  }
}
