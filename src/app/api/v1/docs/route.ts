export const dynamic = "force-dynamic";

/** Machine-readable listing of the mock contract. The human-readable spec is API.md. */
export function GET() {
  return Response.json({
    service: "CAREZOA mock backend",
    version: "v1",
    base: "/api/v1",
    auth: "Bearer cz_<patientId>_<secret> (obtained via OTP verify)",
    endpoints: [
      "GET    /health",
      "POST   /auth/otp/request        {phone} → devCode in sandbox",
      "POST   /auth/otp/verify         {phone, code} → token, patient",
      "GET    /profile                 Bearer",
      "PATCH  /profile                 name/dob/gender/city/address",
      "GET    /services                catalog + categories",
      "GET    /providers?q=&city=      distanceKm, coverage (no contact fields by design)",
      "GET    /providers/:id           detail, services, masked reviews",
      "POST   /bookings                creates booking (status scheduled, unpaid)",
      "GET    /bookings?scope=upcoming|past",
      "GET    /bookings/:id            timeline + display-only checkinOtp",
      "PATCH  /bookings/:id            {action:cancel|reschedule}",
      "GET    /bookings/:id/messages   scrubbed chat",
      "POST   /bookings/:id/messages   scrubbed both directions",
      "POST   /calls/masked            {bookingId} → relay number, expiry",
      "POST   /payments                {bookingId, methodId} → checkoutUrl",
      "GET    /payments/:id/checkout   hosted sandbox page (WebView)",
      "POST   /payments/:id            gateway callback {result}",
      "GET    /records                 reports + vitals for completed visits",
      "GET    /family                  members + accessScope",
      "POST   /family                  invite member with scope",
      "PATCH  /family/:id              update scope / revoke / simulate_accept",
      "GET    /packages                care plans + subscribed flag",
      "POST   /packages/:id            subscribe",
      "GET    /tickets, POST /tickets",
      "GET    /payment-methods, POST /payment-methods",
      "DELETE /payment-methods/:id",
      "POST   /sim/advance             MOCK ONLY: advances visit lifecycle",
    ],
    notes: [
      "Provider payloads never include phone/email/social handles.",
      "Chat bodies are scrubbed of contact patterns on write.",
      "checkinOtp is revealed to the family verbally at the door — display-only in-app.",
    ],
  });
}
