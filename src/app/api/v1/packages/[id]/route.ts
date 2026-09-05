import { db } from "@/db";
import { czSubscriptions } from "@/db/schema";
import { getPatientId, err } from "@/server/carezoa/http";
import { ensureCarezoaSeed } from "@/server/carezoa/seed";

export const dynamic = "force-dynamic";

/** Subscribe the current patient to a care package (mock-billed). */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await ensureCarezoaSeed();
    const patientId = getPatientId(req);
    const { id } = await params;
    const packageId = Number(id);
    if (!packageId) return err(400, "Invalid package");

    const [sub] = await db
      .insert(czSubscriptions)
      .values({ patientId, packageId, status: "active" })
      .returning();

    return Response.json(
      {
        subscription: {
          id: sub.id,
          packageId: sub.packageId,
          status: sub.status,
          startedAt: sub.startedAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (e) {
    console.error("[v1/packages/:id/subscribe]", e);
    return err(500, "Failed to subscribe");
  }
}
