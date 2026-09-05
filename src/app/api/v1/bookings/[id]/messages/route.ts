import { db } from "@/db";
import { czBookings, czMessages, czProviders } from "@/db/schema";
import { getPatientId, scrubContactInfo, err } from "@/server/carezoa/http";
import { ensureCarezoaSeed } from "@/server/carezoa/seed";
import { asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

function toMsg(m: typeof czMessages.$inferSelect) {
  return {
    id: m.id,
    bookingId: m.bookingId,
    sender: m.sender,
    authorName: m.authorName,
    body: m.body,
    createdAt: m.createdAt.toISOString(),
  };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await ensureCarezoaSeed();
  const { id } = await params;
  const rows = await db
    .select()
    .from(czMessages)
    .where(eq(czMessages.bookingId, Number(id)))
    .orderBy(asc(czMessages.createdAt));
  return Response.json({ items: rows.map(toMsg) });
}

const REPLIES = [
  "Noted, thank you! I'll keep that in mind for the visit.",
  "Understood. Please keep the prescriptions handy for review.",
  "Thanks for the update — I'll plan the visit accordingly.",
  "Got it! If anything changes before the visit, just message me here.",
];

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await ensureCarezoaSeed();
    await getPatientId(req);
    const { id } = await params;
    const bookingId = Number(id);
    const body = await req.json();
    const text = String(body.body ?? "").trim();
    if (!text || text.length > 1000) return err(400, "Message body required");

    const [booking] = await db.select().from(czBookings).where(eq(czBookings.id, bookingId)).limit(1);
    if (!booking) return err(404, "Booking not found");
    const [provider] = await db.select().from(czProviders).where(eq(czProviders.id, booking.providerId)).limit(1);
    if (!provider) return err(404, "Provider not found");

    // Anti-bypass: contact info is scrubbed from BOTH directions server-side.
    const [sent] = await db
      .insert(czMessages)
      .values({
        bookingId,
        sender: "patient",
        authorName: "You",
        body: scrubContactInfo(text),
      })
      .returning();

    const [reply] = await db
      .insert(czMessages)
      .values({
        bookingId,
        sender: "provider",
        authorName: provider.name,
        body: scrubContactInfo(REPLIES[Math.floor(Math.random() * REPLIES.length)]),
        createdAt: new Date(Date.now() + 35_000),
      })
      .returning();

    return Response.json({ sent: toMsg(sent), reply: toMsg(reply) }, { status: 201 });
  } catch (e) {
    console.error("[v1/messages:post]", e);
    return Response.json({ error: "Failed to send message" }, { status: 500 });
  }
}
