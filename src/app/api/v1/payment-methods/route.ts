import { db } from "@/db";
import { czPaymentMethods } from "@/db/schema";
import { getPatientId, err } from "@/server/carezoa/http";
import { ensureCarezoaSeed } from "@/server/carezoa/seed";
import { asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await ensureCarezoaSeed();
  const patientId = getPatientId(req);
  const rows = await db
    .select()
    .from(czPaymentMethods)
    .where(eq(czPaymentMethods.patientId, patientId))
    .orderBy(asc(czPaymentMethods.id));
  return Response.json({
    items: rows.map((m) => ({ id: m.id, type: m.type, label: m.label, detail: m.detail })),
  });
}

export async function POST(req: Request) {
  try {
    await ensureCarezoaSeed();
    const patientId = getPatientId(req);
    const body = await req.json();
    const type = body.type === "upi" ? "upi" : "card";
    const detail = String(body.detail ?? "").trim();
    if (!detail) return err(400, "Card or UPI details required");
    const [row] = await db
      .insert(czPaymentMethods)
      .values({
        patientId,
        type,
        label: type === "upi" ? "UPI" : "Card",
        detail: type === "upi" ? detail : `•••• ${detail.slice(-4)}`,
      })
      .returning();
    return Response.json({ method: { id: row.id, type: row.type, label: row.label, detail: row.detail } }, { status: 201 });
  } catch (e) {
    console.error("[v1/payment-methods:post]", e);
    return err(500, "Failed to add method");
  }
}
