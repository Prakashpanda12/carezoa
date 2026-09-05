import { ensureCarezoaSeed } from "@/server/carezoa/seed";
import { phoneExists } from "@/server/carezoa/otpService";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/auth/check
 * Check if phone number exists in database
 * 
 * Request: { phone: string }
 * Response: { exists: boolean, needsOnboarding?: boolean }
 */
export async function POST(req: Request) {
  try {
    await ensureCarezoaSeed();
    const body = await req.json();
    const phone = String(body.phone ?? "").replace(/[\s-]/g, "");
    
    if (!/^\+?\d{10,15}$/.test(phone)) {
      return Response.json(
        { error: "Valid phone number required" },
        { status: 400 }
      );
    }
    
    // Check if phone exists
    const { db } = await import("@/db");
    const { czPatients } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    
    const [patient] = await db
      .select()
      .from(czPatients)
      .where(eq(czPatients.phone, phone))
      .limit(1);
    
    if (!patient) {
      return Response.json({ exists: false });
    }
    
    return Response.json({
      exists: true,
      needsOnboarding: !patient.onboardingDone,
    });
  } catch (e) {
    console.error("[v1/auth/check]", e);
    return Response.json({ error: "Check failed" }, { status: 500 });
  }
}
