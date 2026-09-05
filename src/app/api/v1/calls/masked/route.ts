import { ensureCarezoaSeed } from "@/server/carezoa/seed";

export const dynamic = "force-dynamic";

/**
 * Masked calling: returns a short-lived relay number. The provider's real
 * number is never in the payload — by contract.
 */
export async function POST(req: Request) {
  try {
    await ensureCarezoaSeed();
    const body = await req.json();
    const bookingId = Number(body.bookingId);
    if (!bookingId) {
      return Response.json({ error: "bookingId required" }, { status: 400 });
    }
    return Response.json(
      {
        callId: `call_${Date.now()}`,
        bookingId,
        maskedNumber: "+91 80 4719 2417", // CAREZOA relay line (mock)
        expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
        note: "Relay number connects through CAREZOA. Neither party's real number is ever exposed.",
      },
      { status: 201 },
    );
  } catch (e) {
    console.error("[v1/calls/masked]", e);
    return Response.json({ error: "Could not start masked call" }, { status: 500 });
  }
}
