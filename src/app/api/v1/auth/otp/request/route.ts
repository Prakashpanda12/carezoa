import { ensureCarezoaSeed } from "@/server/carezoa/seed";

export const dynamic = "force-dynamic";

/** Mock OTP dispatch. Real backend would SMS; mock returns the dev code inline. */
export async function POST(req: Request) {
  try {
    await ensureCarezoaSeed();
    const body = await req.json();
    const phone = String(body.phone ?? "");
    if (!/^\+?\d{10,15}$/.test(phone.replace(/[\s-]/g, ""))) {
      return Response.json({ error: "Valid phone number required" }, { status: 400 });
    }
    return Response.json({
      requestId: `otp_${Date.now()}`,
      phone,
      expiresInSec: 300,
      devCode: "123456", // mock-server convenience; never present in production
    });
  } catch (e) {
    console.error("[v1/otp/request]", e);
    return Response.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
