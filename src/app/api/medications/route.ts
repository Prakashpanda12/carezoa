import { db } from "@/db";
import { doses, medications } from "@/db/schema";
import { toMedication } from "@/server/data";
import { ensureSeed } from "@/server/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSeed();
    const rows = await db.select().from(medications);
    return Response.json(rows.map(toMedication));
  } catch (err) {
    console.error("[medications:get]", err);
    return Response.json({ error: "Failed to load medications" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureSeed();
    const body = await req.json();
    if (!body.name || !body.dosage) {
      return Response.json({ error: "Name and dosage are required" }, { status: 400 });
    }
    const timesOfDay = Array.isArray(body.timesOfDay)
      ? body.timesOfDay.filter((t: unknown) => typeof t === "string" && /^\d{2}:\d{2}$/.test(t as string))
      : [];
    const refillBy = /^\d{4}-\d{2}-\d{2}$/.test(body.refillBy ?? "")
      ? body.refillBy
      : new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
    const [med] = await db
      .insert(medications)
      .values({
        name: String(body.name),
        dosage: String(body.dosage),
        form: typeof body.form === "string" ? body.form : "tablet",
        instructions: typeof body.instructions === "string" ? body.instructions : "",
        prescribedBy: typeof body.prescribedBy === "string" && body.prescribedBy ? body.prescribedBy : "Self-reported",
        timesOfDay,
        refillBy,
        pillsLeft: Number(body.pillsLeft) || 30,
        supplyDays: Number(body.supplyDays) || 30,
        accent: ["emerald", "amber", "sky", "rose"].includes(body.accent) ? body.accent : "sky",
      })
      .returning();

    // Generate upcoming scheduled doses for the next 3 days.
    if (timesOfDay.length > 0) {
      const newDoses: { medicationId: number; scheduledAt: Date }[] = [];
      const now = Date.now();
      for (let day = 0; day < 3; day++) {
        for (const t of timesOfDay as string[]) {
          const [h, m] = t.split(":").map(Number);
          const d = new Date(now + day * 86_400_000);
          d.setHours(h, m, 0, 0);
          if (d.getTime() > now - 3_600_000) {
            newDoses.push({ medicationId: med.id, scheduledAt: d });
          }
        }
      }
      if (newDoses.length) await db.insert(doses).values(newDoses);
    }
    return Response.json(toMedication(med), { status: 201 });
  } catch (err) {
    console.error("[medications:post]", err);
    return Response.json({ error: "Failed to add medication" }, { status: 500 });
  }
}
