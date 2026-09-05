import { db } from "@/db";
import { czBookings, czPayments } from "@/db/schema";
import { getPatientId, err } from "@/server/carezoa/http";
import { ensureCarezoaSeed } from "@/server/carezoa/seed";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** Creates a payment intent; client opens checkoutUrl in a WebView/SDK bridge. */
export async function POST(req: Request) {
  try {
    await ensureCarezoaSeed();
    const patientId = getPatientId(req);
    const body = await req.json();
    const bookingId = Number(body.bookingId);
    const methodId = body.methodId ? Number(body.methodId) : null;

    const [booking] = await db
      .select()
      .from(czBookings)
      .where(and(eq(czBookings.id, bookingId), eq(czBookings.patientId, patientId)))
      .limit(1);
    if (!booking) return err(404, "Booking not found");
    if (booking.paymentStatus === "paid") return err(409, "Booking already paid");

    const [payment] = await db
      .insert(czPayments)
      .values({ bookingId, methodId, amountInr: booking.amountInr })
      .returning();

    await db
      .update(czBookings)
      .set({ paymentStatus: "pending" })
      .where(eq(czBookings.id, bookingId));

    return Response.json(
      {
        paymentId: payment.id,
        bookingId,
        amountInr: payment.amountInr,
        currency: "INR",
        checkoutUrl: `/api/v1/payments/${payment.id}/checkout`,
        status: "pending",
      },
      { status: 201 },
    );
  } catch (e) {
    console.error("[v1/payments:intent]", e);
    return Response.json({ error: "Failed to create payment" }, { status: 500 });
  }
}
