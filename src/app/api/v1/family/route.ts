import { db } from "@/db";
import { czFamily } from "@/db/schema";
import { getPatientId, err } from "@/server/carezoa/http";
import { ensureCarezoaSeed } from "@/server/carezoa/seed";
import { asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

function toMember(m: typeof czFamily.$inferSelect) {
  return {
    id: m.id,
    name: m.name,
    relation: m.relation,
    phone: m.phone, // FAMILY member's phone — patient owns this data, fine to return
    accessScope: m.accessScope,
    inviteStatus: m.inviteStatus,
    createdAt: m.createdAt.toISOString(),
  };
}

export async function GET(req: Request) {
  await ensureCarezoaSeed();
  const patientId = getPatientId(req);
  const rows = await db
    .select()
    .from(czFamily)
    .where(eq(czFamily.patientId, patientId))
    .orderBy(asc(czFamily.id));
  return Response.json({ items: rows.map(toMember) });
}

export async function POST(req: Request) {
  try {
    await ensureCarezoaSeed();
    const patientId = getPatientId(req);
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const relation = String(body.relation ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    if (name.length < 2 || !relation || !/^\+?\d{10,15}$/.test(phone.replace(/[\s-]/g, ""))) {
      return err(400, "Name, relation and a valid phone are required");
    }
    const scope = body.accessScope ?? {};
    const [row] = await db
      .insert(czFamily)
      .values({
        patientId,
        name,
        relation,
        phone,
        accessScope: {
          viewVisits: scope.viewVisits !== false,
          viewRecords: scope.viewRecords === true,
          chat: scope.chat === true,
        },
        inviteStatus: "pending",
      })
      .returning();
    return Response.json({ member: toMember(row), invite: { status: "pending", channel: "sms" } }, { status: 201 });
  } catch (e) {
    console.error("[v1/family:post]", e);
    return err(500, "Failed to invite member");
  }
}
