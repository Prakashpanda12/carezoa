import { db } from "@/db";
import { czPatients } from "@/db/schema";
import { ensureCarezoaSeed } from "@/server/carezoa/seed";
import { verifyOtp, isDevMode, DEV_OTP } from "@/server/carezoa/otpService";
import { generateToken } from "@/server/carezoa/jwtService";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/auth/otp/verify
 * Verify OTP and authenticate user
 * 
 * Request body: { phone: string, code: string }
 * Response: { token: string, isNewUser: boolean, patient: Patient }
 * 
 * Flow:
 * 1. Verify OTP
 * 2. Find or create patient
 * 3. Generate JWT token
 * 4. Return token and patient data
 */
export async function POST(req: Request) {
  try {
    await ensureCarezoaSeed();
    const body = await req.json();
    const phone = String(body.phone ?? "").replace(/[\s-]/g, "");
    const code = String(body.code ?? "");
    
    // Validate input
    if (!phone || !code) {
      return Response.json(
        { error: "Phone number and OTP code are required" },
        { status: 400 }
      );
    }
    
    // Verify OTP
    // In dev mode, also accept the hardcoded DEV_OTP for testing
    const otpResult = isDevMode() && code === DEV_OTP 
      ? { valid: true }
      : verifyOtp(phone, code);
    
    if (!otpResult.valid) {
      return Response.json(
        { error: otpResult.error || "Invalid OTP" },
        { status: 401 }
      );
    }
    
    // Find or create patient
    let [patient] = await db
      .select()
      .from(czPatients)
      .where(eq(czPatients.phone, phone))
      .limit(1);
    
    let isNewUser = false;
    
    if (!patient) {
      // Create new patient
      [patient] = await db
        .insert(czPatients)
        .values({
          name: "",
          phone,
          onboardingDone: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      isNewUser = true;
      console.log(`[AUTH] Created new patient: ${patient.id} (${phone})`);
    } else {
      console.log(`[AUTH] Existing patient logged in: ${patient.id} (${phone})`);
    }
    
    // Generate JWT token
    const token = generateToken(patient.id, phone);
    
    // Determine if user needs onboarding
    const needsOnboarding = isNewUser || !patient.onboardingDone;
    
    return Response.json({
      token,
      isNewUser: needsOnboarding,
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
    console.error("[v1/otp/verify]", e);
    return Response.json({ error: "Verification failed" }, { status: 500 });
  }
}
