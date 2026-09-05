import { db } from "@/db";
import { ensureCarezoaSeed } from "@/server/carezoa/seed";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    await ensureCarezoaSeed();
    return Response.json({ status: "ok", service: "carezoa-mock", version: "v1" });
  } catch (e) {
    console.error("[v1/health]", e);
    return Response.json({ status: "down" }, { status: 500 });
  }
}
