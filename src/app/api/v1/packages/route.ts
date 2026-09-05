import { db } from "@/db";
import { czPackages, czSubscriptions } from "@/db/schema";
import { getPatientId } from "@/server/carezoa/http";
import { ensureCarezoaSeed } from "@/server/carezoa/seed";
import { and, asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await ensureCarezoaSeed();
  const patientId = getPatientId(req);
  const rows = await db.select().from(czPackages).orderBy(asc(czPackages.pricePerMonthInr));
  const subs = await db
    .select()
    .from(czSubscriptions)
    .where(and(eq(czSubscriptions.patientId, patientId), eq(czSubscriptions.status, "active")));
  const activeIds = new Set(subs.map((s) => s.packageId));
  return Response.json({
    items: rows.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      visitsPerMonth: p.visitsPerMonth,
      pricePerMonthInr: p.pricePerMonthInr,
      currency: "INR",
      includes: p.includes,
      bestFor: p.bestFor,
      subscribed: activeIds.has(p.id),
    })),
  });
}
