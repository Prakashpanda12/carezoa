import { db } from "@/db";
import { appointments } from "@/db/schema";
import { toAppointment } from "@/server/data";
import { ensureSeed } from "@/server/seed";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const ACTIONS: Record<string, "cancelled" | "confirmed" | "pending"> = {
  cancel: "cancelled",
  confirm: "confirmed",
  reopen: "pending",
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await ensureSeed();
    const { id } = await params;
    const appointmentId = Number(id);
    if (!Number.isInteger(appointmentId)) {
      return Response.json({ error: "Invalid id" }, { status: 400 });
    }
    const body = await req.json();
    const status = ACTIONS[body.action];
    if (!status) {
      return Response.json({ error: "Unknown action" }, { status: 400 });
    }
    const [row] = await db
      .update(appointments)
      .set({ status })
      .where(eq(appointments.id, appointmentId))
      .returning();
    if (!row) {
      return Response.json({ error: "Appointment not found" }, { status: 404 });
    }
    return Response.json(toAppointment(row));
  } catch (err) {
    console.error("[appointments:patch]", err);
    return Response.json({ error: "Failed to update appointment" }, { status: 500 });
  }
}
