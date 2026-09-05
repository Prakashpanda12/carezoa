import { db } from "@/db";
import { czProviders } from "@/db/schema";
import { toProvider } from "@/server/carezoa/http";
import { ensureCarezoaSeed } from "@/server/carezoa/seed";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

// Reference point for distance math (Bhubaneswar — Patia). A real deployment
// resolves this from the user's location query params.
const REF = { lat: 20.3525, lng: 85.8305 };

export async function GET(req: Request) {
  try {
    await ensureCarezoaSeed();
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") ?? "").toLowerCase();
    const city = (url.searchParams.get("city") ?? "").toLowerCase();
    const category = url.searchParams.get("category");

    let rows = await db.select().from(czProviders).orderBy(desc(czProviders.rating));
    if (q) {
      rows = rows.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.title.toLowerCase().includes(q) ||
          p.qualifications.some((x) => x.toLowerCase().includes(q)),
      );
    }
    if (city) rows = rows.filter((p) => p.city.toLowerCase() === city);
    void category; // reserved for service-linked filtering in the full backend

    return Response.json({ items: rows.map((p) => toProvider(p, REF)) });
  } catch (e) {
    console.error("[v1/providers]", e);
    return Response.json({ error: "Failed to load providers" }, { status: 500 });
  }
}
