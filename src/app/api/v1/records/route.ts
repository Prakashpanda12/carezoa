import { db } from "@/db";
import { czRecords } from "@/db/schema";
import { getBookingWithJoins, getPatientId, err } from "@/server/carezoa/http";
import { ensureCarezoaSeed } from "@/server/carezoa/seed";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await ensureCarezoaSeed();
    void getPatientId(req);
    const rows = await db.select().from(czRecords).orderBy(desc(czRecords.createdAt));
    const items = [];
    for (const r of rows) {
      const booking = await getBookingWithJoins(r.bookingId);
      if (!booking) continue;
      items.push({
        id: r.id,
        booking,
        summary: r.summary,
        vitals: r.vitals,
        notes: r.notes,
        createdAt: r.createdAt.toISOString(),
      });
    }
    return Response.json({ items });
  } catch (e) {
    console.error("[v1/records]", e);
    return err(500, "Failed to load records");
  }
}
