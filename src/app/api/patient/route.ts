import { db } from "@/db";
import { patients } from "@/db/schema";
import { toPatient } from "@/server/data";
import { ensureSeed } from "@/server/seed";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const EDITABLE = [
  "phone",
  "address",
  "email",
  "preferredName",
  "pharmacy",
  "emergencyContactName",
  "emergencyContactPhone",
] as const;

export async function GET() {
  try {
    await ensureSeed();
    const rows = await db.select().from(patients).limit(1);
    return Response.json(toPatient(rows[0]));
  } catch (err) {
    console.error("[patient:get]", err);
    return Response.json({ error: "Failed to load patient" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await ensureSeed();
    const body = await req.json();
    const patch: Record<string, string> = {};
    for (const key of EDITABLE) {
      if (typeof body[key] === "string" && body[key].trim()) {
        patch[key] = body[key].trim();
      }
    }
    if (Object.keys(patch).length === 0) {
      return Response.json({ error: "No editable fields provided" }, { status: 400 });
    }
    const [row] = await db
      .update(patients)
      .set(patch)
      .where(eq(patients.id, 1))
      .returning();
    return Response.json(toPatient(row));
  } catch (err) {
    console.error("[patient:patch]", err);
    return Response.json({ error: "Failed to update patient" }, { status: 500 });
  }
}
