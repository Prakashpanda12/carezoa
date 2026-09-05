import {
  bookingDetailsSchema,
  containsContactInfo,
  familyInviteSchema,
  otpSchema,
  phoneSchema,
} from "../utils/schemas";

describe("validation schemas (zod)", () => {
  it("accepts valid phone numbers with country code", () => {
    expect(phoneSchema.safeParse({ phone: "+919437000001" }).success).toBe(true);
    expect(phoneSchema.safeParse({ phone: "+1 415 555 0100" }).success).toBe(true);
  });

  it("rejects bad phone numbers", () => {
    expect(phoneSchema.safeParse({ phone: "123" }).success).toBe(false);
    expect(phoneSchema.safeParse({ phone: "not-a-number" }).success).toBe(false);
  });

  it("enforces 6-digit OTP", () => {
    expect(otpSchema.safeParse({ code: "123456" }).success).toBe(true);
    expect(otpSchema.safeParse({ code: "12345" }).success).toBe(false);
    expect(otpSchema.safeParse({ code: "abcdef" }).success).toBe(false);
  });

  it("validates booking patient details", () => {
    const ok = bookingDetailsSchema.safeParse({
      patientName: "Biren Mohanty",
      age: "68",
      gender: "M",
      address: "Flat 4B, Silver Oak Residency",
      city: "Bhubaneswar",
      instructions: "Soft diet only",
    });
    expect(ok.success).toBe(true);
    const tooOld = bookingDetailsSchema.safeParse({
      patientName: "X Y",
      age: "150",
      gender: "M",
      address: "Somewhere long enough",
      city: "Cuttack",
      instructions: "",
    });
    expect(tooOld.success).toBe(false);
  });

  it("validates family invites", () => {
    expect(
      familyInviteSchema.safeParse({ name: "Ma", relation: "Mother", phone: "+919438100202" }).success,
    ).toBe(true);
  });
});

describe("anti-bypass contact guard", () => {
  it("flags phone numbers", () => {
    expect(containsContactInfo("call me on 9437100000")).toBe(true);
    expect(containsContactInfo("reach me at +91 94371 00000")).toBe(true);
  });
  it("flags emails and social handles", () => {
    expect(containsContactInfo("mail me at a.b@gmail.com")).toBe(true);
    expect(containsContactInfo("ping me on whatsapp")).toBe(true);
  });
  it("allows normal clinical chat", () => {
    expect(containsContactInfo("Please give him the 8am dose before breakfast")).toBe(false);
  });
});
