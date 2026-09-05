import { db } from "@/db";
import { czPaymentMethods } from "@/db/schema";
import { getPatientId, err } from "@/server/carezoa/http";
import { ensureCarezoaSeed } from "@/server/carezoa/seed";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await ensureCarezoaSeed();
    const patientId = getPatientId(req);
    const { id } = await params;
    const deleted = await db
      .delete(czPaymentMethods)
      .where(and(eq(czPaymentMethods.id, Number(id)), eq(czPaymentMethods.patientId, patientId)))
      .returning();
    if (!deleted.length) return err(404, "Method not found");
    return Response.json({ ok: true });
  } catch (e) {
    console.error("[v1/payment-methods:delete]", e);
    return err(500, "Failed to remove method");
  }
}
