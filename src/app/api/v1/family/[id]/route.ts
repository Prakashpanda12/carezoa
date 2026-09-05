import { db } from "@/db";
import { czFamily } from "@/db/schema";
import { getPatientId, err } from "@/server/carezoa/http";
import { ensureCarezoaSeed } from "@/server/carezoa/seed";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await ensureCarezoaSeed();
    const patientId = getPatientId(req);
    const { id } = await params;
    const body = await req.json();

    const [existing] = await db
      .select()
      .from(czFamily)
      .where(and(eq(czFamily.id, Number(id)), eq(czFamily.patientId, patientId)))
      .limit(1);
    if (!existing) return err(404, "Member not found");

    let patch: Partial<typeof existing> = {};
    if (body.action === "revoke") {
      patch = { inviteStatus: "revoked" };
    } else if (body.action === "simulate_accept") {
      // mock-server convenience: simulates the invitee accepting their invite
      patch = { inviteStatus: "active" };
    } else if (body.accessScope) {
      patch = {
        accessScope: {
          viewVisits: body.accessScope.viewVisits !== false,
          viewRecords: body.accessScope.viewRecords === true,
          chat: body.accessScope.chat === true,
        },
      };
    } else {
      return err(400, "Nothing to update");
    }

    const [row] = await db
      .update(czFamily)
      .set(patch)
      .where(eq(czFamily.id, existing.id))
      .returning();

    return Response.json({
      member: {
        id: row.id,
        name: row.name,
        relation: row.relation,
        phone: row.phone,
        accessScope: row.accessScope,
        inviteStatus: row.inviteStatus,
        createdAt: row.createdAt.toISOString(),
      },
    });
  } catch (e) {
    console.error("[v1/family/:id]", e);
    return err(500, "Failed to update member");
  }
}
