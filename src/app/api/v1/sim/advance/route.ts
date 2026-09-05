import { db } from "@/db";
import { czBookings, czRecords } from "@/db/schema";
import { getBookingWithJoins, err } from "@/server/carezoa/http";
import { ensureCarezoaSeed } from "@/server/carezoa/seed";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const FLOW: Record<string, string> = {
  confirmed: "en_route",
  scheduled: "en_route",
  en_route: "checked_in",
  checked_in: "in_service",
  in_service: "completed",
};

/**
 * MOCK-SERVER DEV TOOL — simulates the provider app's side of the lifecycle:
 * provider departs → family verbally shares the OTP → check-in → service →
 * completion (which also generates a care record). Not part of the product API.
 */
export async function POST(req: Request) {
  try {
    await ensureCarezoaSeed();
    const body = await req.json();
    const bookingId = Number(body.bookingId);
    const [b] = await db.select().from(czBookings).where(eq(czBookings.id, bookingId)).limit(1);
    if (!b) return err(404, "Booking not found");

    const next = FLOW[b.status];
    if (!next) {
      return err(409, `Cannot advance from status ${b.status}`);
    }

    const now = new Date();
    const patch: Record<string, unknown> = { status: next };
    if (next === "en_route") {
      patch.enRouteAt = now;
      patch.checkinOtp = String(Math.floor(1000 + Math.random() * 9000));
      if (b.paymentStatus !== "paid") patch.status = "en_route"; // visits require payment in prod; mock allows
    }
    if (next === "checked_in") patch.checkedInAt = now;
    if (next === "in_service") patch.startedAt = now;
    if (next === "completed") {
      patch.completedAt = now;
      await db.insert(czRecords).values({
        bookingId,
        summary: "Visit completed successfully. Vitals stable and care plan followed as instructed.",
        vitals: { "Blood pressure": "124/82 mmHg", Pulse: "76 bpm", SpO2: "98%", Temperature: "98.4°F" },
        notes: "Family was given a summary of today's care. Next visit as scheduled.",
      });
    }

    await db.update(czBookings).set(patch).where(eq(czBookings.id, bookingId));
    const dto = await getBookingWithJoins(bookingId);
    return Response.json(dto);
  } catch (e) {
    console.error("[v1/sim/advance]", e);
    return err(500, "Failed to advance status");
  }
}
