import { db } from "@/db";
import { czBookings } from "@/db/schema";
import { getBookingWithJoins, getPatientId, err } from "@/server/carezoa/http";
import { ensureCarezoaSeed } from "@/server/carezoa/seed";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await ensureCarezoaSeed();
  const { id } = await params;
  const booking = await getBookingWithJoins(Number(id));
  if (!booking) return err(404, "Booking not found");
  void getPatientId(req);
  return Response.json(booking);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await ensureCarezoaSeed();
    const patientId = getPatientId(req);
    const { id } = await params;
    const bookingId = Number(id);
    const body = await req.json();

    const [existing] = await db
      .select()
      .from(czBookings)
      .where(and(eq(czBookings.id, bookingId), eq(czBookings.patientId, patientId)))
      .limit(1);
    if (!existing) return err(404, "Booking not found");

    if (body.action === "cancel") {
      if (["completed", "cancelled", "in_service"].includes(existing.status)) {
        return err(409, `Cannot cancel a booking in status ${existing.status}`);
      }
      await db
        .update(czBookings)
        .set({ status: "cancelled" })
        .where(eq(czBookings.id, bookingId));
    } else if (body.action === "reschedule") {
      const startsAt = new Date(body.startsAt);
      if (Number.isNaN(startsAt.getTime())) return err(400, "Valid startsAt required");
      if (!["scheduled", "confirmed"].includes(existing.status)) {
        return err(409, "Too late to reschedule this visit");
      }
      await db
        .update(czBookings)
        .set({ startsAt })
        .where(eq(czBookings.id, bookingId));
    } else {
      return err(400, "Unknown action");
    }

    const dto = await getBookingWithJoins(bookingId);
    return Response.json(dto);
  } catch (e) {
    console.error("[v1/bookings/:id]", e);
    return Response.json({ error: "Failed to update booking" }, { status: 500 });
  }
}
