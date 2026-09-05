import { db } from "@/db";
import { czServices } from "@/db/schema";
import { ensureCarezoaSeed } from "@/server/carezoa/seed";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureCarezoaSeed();
    const rows = await db.select().from(czServices).orderBy(asc(czServices.id));
    const categories = [...new Set(rows.map((r) => r.category))];
    return Response.json({
      categories,
      items: rows.map((s) => ({
        id: s.id,
        category: s.category,
        name: s.name,
        description: s.description,
        durationMin: s.durationMin,
        basePriceInr: s.basePriceInr,
        currency: "INR",
        icon: s.icon,
      })),
    });
  } catch (e) {
    console.error("[v1/services]", e);
    return Response.json({ error: "Failed to load services" }, { status: 500 });
  }
}
