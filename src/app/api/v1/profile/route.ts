import { db } from "@/db";
import { czPatients } from "@/db/schema";
import { getPatient, getPatientId, err } from "@/server/carezoa/http";
import { ensureCarezoaSeed } from "@/server/carezoa/seed";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const EDITABLE = ["name", "dob", "gender", "city", "address"] as const;

export async function GET(req: Request) {
  await ensureCarezoaSeed();
  const p = await getPatient(getPatientId(req));
  if (!p) return err(404, "Patient not found");
  return Response.json({
    id: p.id,
    name: p.name,
    phone: p.phone,
    dob: p.dob,
    gender: p.gender,
    city: p.city,
    address: p.address,
    onboardingDone: p.onboardingDone,
  });
}

export async function PATCH(req: Request) {
  await ensureCarezoaSeed();
  const id = getPatientId(req);
  const body = await req.json();
  const patch: Record<string, unknown> = {};
  for (const key of EDITABLE) {
    if (typeof body[key] === "string") patch[key] = body[key].trim();
  }
  if (patch.name && patch.dob !== undefined && patch.gender) {
    patch.onboardingDone = true;
  }
  const [row] = await db
    .update(czPatients)
    .set(patch)
    .where(eq(czPatients.id, id))
    .returning();
  if (!row) return err(404, "Patient not found");
  return Response.json({
    id: row.id,
    name: row.name,
    phone: row.phone,
    dob: row.dob,
    gender: row.gender,
    city: row.city,
    address: row.address,
    onboardingDone: row.onboardingDone,
  });
}
