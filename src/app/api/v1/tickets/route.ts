import { db } from "@/db";
import { czTickets } from "@/db/schema";
import { getPatientId, err } from "@/server/carezoa/http";
import { ensureCarezoaSeed } from "@/server/carezoa/seed";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await ensureCarezoaSeed();
  const patientId = getPatientId(req);
  const rows = await db
    .select()
    .from(czTickets)
    .where(eq(czTickets.patientId, patientId))
    .orderBy(desc(czTickets.createdAt));
  return Response.json({
    items: rows.map((t) => ({
      id: t.id,
      subject: t.subject,
      body: t.body,
      status: t.status,
      createdAt: t.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: Request) {
  try {
    await ensureCarezoaSeed();
    const patientId = getPatientId(req);
    const body = await req.json();
    const subject = String(body.subject ?? "").trim();
    const text = String(body.body ?? "").trim();
    if (subject.length < 4 || text.length < 10) {
      return err(400, "Subject (4+ chars) and details (10+ chars) required");
    }
    const [row] = await db
      .insert(czTickets)
      .values({ patientId, subject, body: text })
      .returning();
    return Response.json(
      {
        ticket: {
          id: row.id,
          subject: row.subject,
          status: row.status,
          createdAt: row.createdAt.toISOString(),
        },
        sla: "First response within 4 working hours",
      },
      { status: 201 },
    );
  } catch (e) {
    console.error("[v1/tickets:post]", e);
    return err(500, "Failed to create ticket");
  }
}
