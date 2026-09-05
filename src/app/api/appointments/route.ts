import { db } from "@/db";
import { appointments } from "@/db/schema";
import { toAppointment } from "@/server/data";
import { ensureSeed } from "@/server/seed";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

const KINDS = new Set(["in_person", "video", "phone"]);

export async function GET() {
  try {
    await ensureSeed();
    const rows = await db
      .select()
      .from(appointments)
      .orderBy(asc(appointments.startsAt));
    return Response.json(rows.map(toAppointment));
  } catch (err) {
    console.error("[appointments:get]", err);
    return Response.json({ error: "Failed to load appointments" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureSeed();
    const body = await req.json();
    const kind = KINDS.has(body.kind) ? body.kind : "in_person";
    const startsAt = new Date(body.startsAt);
    if (Number.isNaN(startsAt.getTime())) {
      return Response.json({ error: "Invalid startsAt" }, { status: 400 });
    }
    if (!body.doctorName || !body.specialty || !body.reason) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }
    const location =
      typeof body.location === "string" && body.location
        ? body.location
        : kind === "video"
          ? "Solace Video Visit"
          : kind === "phone"
            ? "Phone call"
            : "Hayes Valley Clinic, 450 Hayes St";
    const [row] = await db
      .insert(appointments)
      .values({
        doctorName: String(body.doctorName),
        specialty: String(body.specialty),
        kind,
        location,
        reason: String(body.reason),
        startsAt,
        durationMin: Number(body.durationMin) || 30,
        status: "pending",
        notes: typeof body.notes === "string" ? body.notes : "",
      })
      .returning();
    return Response.json(toAppointment(row), { status: 201 });
  } catch (err) {
    console.error("[appointments:post]", err);
    return Response.json({ error: "Failed to book appointment" }, { status: 500 });
  }
}
