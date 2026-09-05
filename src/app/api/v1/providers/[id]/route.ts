import { db } from "@/db";
import { czProviders, czReviews, czServices } from "@/db/schema";
import { toProvider } from "@/server/carezoa/http";
import { ensureCarezoaSeed } from "@/server/carezoa/seed";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const REF = { lat: 20.3525, lng: 85.8305 };

/** Map coarse specialties to catalog services for "Services offered". */
const SERVICE_MATCH: Record<string, string[]> = {
  "Critical Care Nurse": ["Home Nursing Visit", "Injection / IV at Home", "Post-Surgery Care"],
  "Elder Care Specialist": ["Elder Companion Care", "Attendant — Day Shift"],
  "Post-Op Recovery Nurse": ["Post-Surgery Care", "Home Nursing Visit"],
  Physiotherapist: ["Physiotherapy Session"],
  "Procedures Nurse": ["Injection / IV at Home", "Home Nursing Visit"],
  "ICU Nurse": ["Home Nursing Visit", "Post-Surgery Care"],
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await ensureCarezoaSeed();
    const { id } = await params;
    const pid = Number(id);
    const [p] = await db.select().from(czProviders).where(eq(czProviders.id, pid)).limit(1);
    if (!p) return Response.json({ error: "Provider not found" }, { status: 404 });

    const reviews = await db
      .select()
      .from(czReviews)
      .where(eq(czReviews.providerId, pid))
      .orderBy(desc(czReviews.createdAt));

    const services = await db.select().from(czServices);
    const offered = services.filter((s) =>
      (SERVICE_MATCH[p.title] ?? []).includes(s.name),
    );

    return Response.json({
      ...toProvider(p, REF),
      services: offered.map((s) => ({
        id: s.id,
        name: s.name,
        durationMin: s.durationMin,
        basePriceInr: s.basePriceInr,
        currency: "INR",
      })),
      reviews: reviews.map((r) => ({
        id: r.id,
        authorName: r.authorName,
        rating: r.rating,
        text: r.text,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    console.error("[v1/providers/:id]", e);
    return Response.json({ error: "Failed to load provider" }, { status: 500 });
  }
}
