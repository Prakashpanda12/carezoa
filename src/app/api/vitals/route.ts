import { db } from "@/db";
import { vitals } from "@/db/schema";
import { toVital } from "@/server/data";
import { ensureSeed } from "@/server/seed";
import { asc, gte } from "drizzle-orm";

export const dynamic = "force-dynamic";

const TYPES: Record<string, { unit: string; dual?: boolean }> = {
  heart_rate: { unit: "bpm" },
  blood_pressure: { unit: "mmHg", dual: true },
  weight: { unit: "kg" },
  glucose: { unit: "mg/dL" },
  oxygen: { unit: "%" },
};

export async function GET(req: Request) {
  try {
    await ensureSeed();
    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    const days = Math.min(90, Math.max(7, Number(url.searchParams.get("days")) || 30));
    const since = new Date(Date.now() - days * 86_400_000);
    const rows = await db
      .select()
      .from(vitals)
      .where(gte(vitals.recordedAt, since))
      .orderBy(asc(vitals.recordedAt));
    const all = rows.map(toVital);
    return Response.json(type ? all.filter((v) => v.type === type) : all);
  } catch (err) {
    console.error("[vitals:get]", err);
    return Response.json({ error: "Failed to load vitals" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureSeed();
    const body = await req.json();
    const meta = TYPES[body.type];
    if (!meta) {
      return Response.json({ error: "Unknown vital type" }, { status: 400 });
    }
    const value = Number(body.value);
    const value2 = meta.dual ? Number(body.value2) : null;
    if (!Number.isFinite(value) || value <= 0) {
      return Response.json({ error: "Invalid value" }, { status: 400 });
    }
    if (meta.dual && (!Number.isFinite(value2) || (value2 ?? 0) <= 0)) {
      return Response.json({ error: "Diastolic value required" }, { status: 400 });
    }
    const recordedAt = body.recordedAt ? new Date(body.recordedAt) : new Date();
    const [row] = await db
      .insert(vitals)
      .values({
        type: String(body.type),
        value,
        value2,
        unit: meta.unit,
        note: typeof body.note === "string" ? body.note.slice(0, 280) : "",
        recordedAt: Number.isNaN(recordedAt.getTime()) ? new Date() : recordedAt,
      })
      .returning();
    return Response.json(toVital(row), { status: 201 });
  } catch (err) {
    console.error("[vitals:post]", err);
    return Response.json({ error: "Failed to log vital" }, { status: 500 });
  }
}
