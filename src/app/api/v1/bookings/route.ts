import { db } from "@/db";
import { czBookings, czProviders, czServices } from "@/db/schema";
import { getPatientId, hydrateBookings, err } from "@/server/carezoa/http";
import { ensureCarezoaSeed } from "@/server/carezoa/seed";
import { asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await ensureCarezoaSeed();
    const patientId = getPatientId(req);
    const scope = new URL(req.url).searchParams.get("scope") ?? "all";
    const rows = await db
      .select()
      .from(czBookings)
      .where(eq(czBookings.patientId, patientId))
      .orderBy(asc(czBookings.startsAt));
    const now = Date.now();
    const filtered = rows.filter((b) => {
      const start = b.startsAt.getTime();
      if (scope === "upcoming")
        return b.status !== "cancelled" && b.status !== "completed" && start > now - 3_600_000;
      if (scope === "past") return b.status === "completed" || b.status === "cancelled" || start <= now - 3_600_000;
      return true;
    });
    return Response.json({ items: await hydrateBookings(filtered) });
  } catch (e) {
    console.error("[v1/bookings:get]", e);
    return Response.json({ error: "Failed to load bookings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureCarezoaSeed();
    const patientId = getPatientId(req);
    const body = await req.json();

    const providerId = Number(body.providerId);
    const serviceId = Number(body.serviceId);
    const startsAt = new Date(body.startsAt);
    const patientName = String(body.patientName ?? "").trim();
    const patientAge = Number(body.patientAge);
    const address = String(body.address ?? "").trim();
    const city = String(body.city ?? "").trim();
    if (!providerId || !serviceId || Number.isNaN(startsAt.getTime())) {
      return err(400, "providerId, serviceId and startsAt are required");
    }
    if (!patientName || !Number.isFinite(patientAge) || patientAge < 0 || patientAge > 120) {
      return err(400, "Valid patient details are required");
    }
    if (!address || !city) return err(400, "Visit address and city are required");

    const [provider] = await db.select().from(czProviders).where(eq(czProviders.id, providerId)).limit(1);
    const [service] = await db.select().from(czServices).where(eq(czServices.id, serviceId)).limit(1);
    if (!provider) return err(404, "Provider not found");
    if (!service) return err(404, "Service not found");

    const [row] = await db
      .insert(czBookings)
      .values({
        patientId,
        providerId,
        serviceId,
        status: "scheduled",
        paymentStatus: "unpaid",
        startsAt,
        durationMin: service.durationMin,
        patientName,
        patientAge,
        patientGender: String(body.patientGender ?? ""),
        address,
        city,
        instructions: String(body.instructions ?? "").slice(0, 500),
        amountInr: service.basePriceInr,
      })
      .returning();

    const [dto] = await hydrateBookings([row]);
    return Response.json({ booking: dto }, { status: 201 });
  } catch (e) {
    console.error("[v1/bookings:post]", e);
    return Response.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
