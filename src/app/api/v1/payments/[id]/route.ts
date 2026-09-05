import { db } from "@/db";
import { czBookings, czPayments } from "@/db/schema";
import { ensureCarezoaSeed } from "@/server/carezoa/seed";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const inr = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

/** Hosted mock-gateway checkout page, opened by the app inside a WebView. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await ensureCarezoaSeed();
  const { id } = await params;
  const [payment] = await db.select().from(czPayments).where(eq(czPayments.id, Number(id))).limit(1);
  if (!payment) return new Response("Payment not found", { status: 404 });
  const [booking] = await db.select().from(czBookings).where(eq(czBookings.id, payment.bookingId)).limit(1);

  const html = `<!doctype html>
<html><head><meta name="viewport" content="width=device-width, initial-scale=1">
<title>CAREZOA Pay</title>
<style>
  body{font-family:-apple-system,system-ui,sans-serif;background:#0B0D0B;color:#FAF8F3;display:grid;place-items:center;min-height:100vh;margin:0}
  .card{background:#191611;border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:28px;width:min(340px,86vw);text-align:center}
  .amt{font-size:44px;font-weight:800;letter-spacing:-1px;margin:10px 0 2px}
  .sub{color:#a8a294;font-size:13px;margin-bottom:22px}
  .pay{display:block;width:100%;background:#16A37B;color:#fff;font-weight:700;font-size:16px;border:0;border-radius:999px;padding:14px;margin-top:10px;cursor:pointer}
  .fail{display:block;width:100%;background:transparent;color:#DE5B42;font-size:13px;border:1px solid rgba(222,91,66,.4);border-radius:999px;padding:11px;margin-top:10px;cursor:pointer}
  .spin{display:none;color:#a8a294;font-size:13px;margin-top:14px}
</style></head><body>
<div class="card">
  <div style="font-size:12px;letter-spacing:2px;color:#16A37B;font-weight:700">CAREZOA PAY · SANDBOX</div>
  <div class="amt">${inr(payment.amountInr)}</div>
  <div class="sub">Booking #${payment.bookingId} · ${booking?.patientName ?? ""}</div>
  <button class="pay" onclick="finish('success')">Pay ${inr(payment.amountInr)}</button>
  <button class="fail" onclick="finish('failed')">Simulate failure</button>
  <div class="spin" id="spin">Confirming with gateway…</div>
</div>
<script>
async function finish(result){
  document.getElementById('spin').style.display='block';
  await fetch(location.pathname, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({result})});
  location.href = 'carezoa://payment/' + result + '?bookingId=${payment.bookingId}&paymentId=${payment.id}';
}
</script>
</body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

/** Gateway callback (mock): marks payment + booking state. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await ensureCarezoaSeed();
    const { id } = await params;
    const body = await req.json();
    const result = body.result === "success" ? "success" : "failed";

    const [payment] = await db.select().from(czPayments).where(eq(czPayments.id, Number(id))).limit(1);
    if (!payment) return Response.json({ error: "Payment not found" }, { status: 404 });

    await db.update(czPayments).set({ status: result }).where(eq(czPayments.id, payment.id));

    if (result === "success") {
      await db
        .update(czBookings)
        .set({
          paymentStatus: "paid",
          status: "confirmed",
          confirmedAt: new Date(),
        })
        .where(eq(czBookings.id, payment.bookingId));
    } else {
      await db
        .update(czBookings)
        .set({ paymentStatus: "failed", status: "scheduled" })
        .where(eq(czBookings.id, payment.bookingId));
    }

    return Response.json({ paymentId: payment.id, bookingId: payment.bookingId, status: result });
  } catch (e) {
    console.error("[v1/payments/:id]", e);
    return Response.json({ error: "Failed to confirm payment" }, { status: 500 });
  }
}
