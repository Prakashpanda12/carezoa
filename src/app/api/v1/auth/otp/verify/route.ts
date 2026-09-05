import { db } from "@/db";
import { czPatients } from "@/db/schema";
import { ensureCarezoaSeed } from "@/server/carezoa/seed";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await ensureCarezoaSeed();
    const body = await req.json();
    const phone = String(body.phone ?? "").replace(/[\s-]/g, "");
    const code = String(body.code ?? "");
    if (code !== "123456") {
      return Response.json({ error: "Incorrect code" }, { status: 401 });
    }
    let [patient] = await db.select().from(czPatients).where(eq(czPatients.phone, phone)).limit(1);
    let isNewUser = false;
    if (!patient) {
      [patient] = await db
        .insert(czPatients)
        .values({ name: "", phone, onboardingDone: false })
        .returning();
      isNewUser = true;
    }
    const token = `cz_${patient.id}_${Math.random().toString(36).slice(2, 12)}`;
    return Response.json({
      token,
      isNewUser: isNewUser || !patient.onboardingDone,
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
