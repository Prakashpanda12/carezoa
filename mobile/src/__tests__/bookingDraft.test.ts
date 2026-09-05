import { bookingToDraft, draftToStartsAt, type BookingDraft } from "../store/bookingDraft";

const completedVisit = {
  providerId: 2,
  serviceId: 3,
  provider: { name: "Anita Das" },
  service: { name: "Elder Companion Care", durationMin: 180, basePriceInr: 1199 },
  patient: { name: "Biren Mohanty", age: 68, gender: "M" },
  address: "Flat 4B, Silver Oak Residency, Patia",
  city: "Bhubaneswar",
  instructions: "Tea at 10:30",
};

describe("Book Again draft (retention control)", () => {
  it("defaults to the SAME provider, service, patient and address", () => {
    const draft = bookingToDraft(completedVisit);
    expect(draft.providerId).toBe(2);
    expect(draft.providerName).toBe("Anita Das");
    expect(draft.serviceName).toBe("Elder Companion Care");
    expect(draft.patientName).toBe("Biren Mohanty");
    expect(draft.age).toBe("68");
    expect(draft.address).toContain("Patia");
  });

  it("always lands on step 0 and clears stale date/time", () => {
    const draft = bookingToDraft(completedVisit);
    expect(draft.step).toBe(0);
    expect(draft.dateISO).toBeNull();
    expect(draft.slot).toBeNull();
  });
});

describe("draftToStartsAt", () => {
  it("composes an ISO datetime from draft day + slot (local time, TZ-agnostic)", () => {
    const draft = { dateISO: "2026-03-12", slot: "10:00" } as BookingDraft;
    const iso = draftToStartsAt(draft);
    expect(iso).not.toBeNull();
    const d = new Date(iso!);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(2); // March
    expect(d.getDate()).toBe(12);
    expect(d.getHours()).toBe(10);
    expect(d.getMinutes()).toBe(0);
  });
  it("returns null when incomplete", () => {
    expect(draftToStartsAt({ dateISO: null, slot: "10:00" } as BookingDraft)).toBeNull();
    expect(draftToStartsAt({ dateISO: "2026-03-12", slot: null } as BookingDraft)).toBeNull();
  });
});
