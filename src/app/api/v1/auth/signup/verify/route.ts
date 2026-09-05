import { db } from "@/db";
import { czPatients } from "@/db/schema";
import { ensureCarezoaSeed } from "@/server/carezoa/seed";
import { verifyOtp, isDevMode, DEV_OTP } from "@/server/carezoa/otpService";
import { generateToken } from "@/server/carezoa/jwtService";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/auth/signup/verify
 * Verify OTP and create new user account
 * 
 * Flow:
 * 1. Verify OTP
 * 2. Retrieve stored signup data
 * 3. Create new patient with all details
 * 4. Generate JWT token
 * 5. Return token and patient data
 * 
 * Request: { phone: string, code: string }
 * 
 * Response: {
 *   token: string,
 *   isNewUser: true,
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
      ? { valid: true, purpose: 'signup' as const, signupData: undefined }
      : verifyOtp(phone, code);
    
    if (!otpResult.valid) {
      return Response.json(
        { error: otpResult.error || "Invalid OTP" },
        { status: 401 }
      );
    }
    
    // Check if this was a signup OTP
    if (otpResult.purpose !== 'signup') {
      return Response.json(
        { error: "Invalid OTP for signup. Please request a new signup OTP." },
        { status: 400 }
      );
    }
    
    // Check if user already exists (shouldn't happen, but safety check)
    const { eq } = await import("drizzle-orm");
    const [existing] = await db
      .select()
      .from(czPatients)
      .where(eq(czPatients.phone, phone))
      .limit(1);
    
    if (existing) {
      return Response.json(
        { error: "Phone number already registered. Please login instead." },
        { status: 409 }
      );
    }
    
    // Get signup data (in dev mode with hardcoded OTP, use empty data)
    const signupData = otpResult.signupData || {
      name: "New User",
      dob: undefined,
      gender: undefined,
      city: undefined,
      address: undefined,
    };
    
    // Parse date of birth if provided
    let dob: Date | null = null;
    if (signupData.dob) {
      try {
        // Support DD/MM/YYYY format
        const parts = signupData.dob.split('/');
        if (parts.length === 3) {
          const [day, month, year] = parts;
          dob = new Date(`${year}-${month}-${day}`);
        } else {
          dob = new Date(signupData.dob);
        }
      } catch (e) {
        console.warn(`[SIGNUP] Invalid DOB format: ${signupData.dob}`);
      }
    }
    
    // Determine if onboarding is complete
    const onboardingDone = !!(
      signupData.name &&
      signupData.dob &&
      signupData.gender
    );
    
    // Create new patient with all details
    const [patient] = await db
      .insert(czPatients)
      .values({
        name: signupData.name,
        phone,
        dob,
        gender: signupData.gender || null,
        city: signupData.city || null,
        address: signupData.address || null,
        onboardingDone,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    console.log(`[AUTH] Created new patient: ${patient.id} (${phone}) - ${signupData.name}`);
    
    // Generate JWT token
    const token = generateToken(patient.id, phone);
    
    return Response.json({
      token,
      isNewUser: true,
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
    console.error("[v1/auth/signup/verify]", e);
    return Response.json({ error: "Signup verification failed" }, { status: 500 });
  }
}
