import { db } from "@/db";
import { doses } from "@/db/schema";
import { toDose } from "@/server/data";
import { ensureSeed } from "@/server/seed";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const ACTIONS = new Set(["taken", "skipped", "missed", "scheduled"]);

export async function POST(req: Request) {
  try {
    await ensureSeed();
    const body = await req.json();
    const medicationId = Number(body.medicationId);
    const scheduledAt = new Date(body.scheduledAt);
    const action = String(body.action);
    if (!Number.isInteger(medicationId) || Number.isNaN(scheduledAt.getTime())) {
      return Response.json({ error: "Invalid dose reference" }, { status: 400 });
    }
    if (!ACTIONS.has(action)) {
      return Response.json({ error: "Invalid action" }, { status: 400 });
    }

    const existing = await db
      .select()
      .from(doses)
      .where(and(eq(doses.medicationId, medicationId), eq(doses.scheduledAt, scheduledAt)))
      .limit(1);

    const values = {
      status: action,
      takenAt: action === "taken" ? new Date() : null,
    };

    if (existing.length > 0) {
      const [row] = await db
        .update(doses)
        .set(values)
        .where(eq(doses.id, existing[0].id))
        .returning();
      return Response.json(toDose(row));
    }
    const [row] = await db
      .insert(doses)
      .values({ medicationId, scheduledAt, ...values })
      .returning();
    return Response.json(toDose(row), { status: 201 });
  } catch (err) {
    console.error("[doses:post]", err);
    return Response.json({ error: "Failed to log dose" }, { status: 500 });
  }
}
