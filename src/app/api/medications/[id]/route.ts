import { db } from "@/db";
import { medications } from "@/db/schema";
import { toMedication } from "@/server/data";
import { ensureSeed } from "@/server/seed";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await ensureSeed();
    const { id } = await params;
    const medicationId = Number(id);
    if (!Number.isInteger(medicationId)) {
      return Response.json({ error: "Invalid id" }, { status: 400 });
    }
    const body = await req.json();
    const patch: Partial<{ active: boolean }> = {};
    if (typeof body.active === "boolean") patch.active = body.active;
    if (Object.keys(patch).length === 0) {
      return Response.json({ error: "Nothing to update" }, { status: 400 });
    }
    const [row] = await db
      .update(medications)
      .set(patch)
      .where(eq(medications.id, medicationId))
      .returning();
    if (!row) {
      return Response.json({ error: "Medication not found" }, { status: 404 });
    }
    return Response.json(toMedication(row));
  } catch (err) {
    console.error("[medications:patch]", err);
    return Response.json({ error: "Failed to update medication" }, { status: 500 });
  }
}
