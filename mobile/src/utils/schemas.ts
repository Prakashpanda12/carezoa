import { z } from "zod";

export const phoneSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^\+?\d[\d\s-]{9,14}$/, "Enter a valid phone number with country code"),
});
export type PhoneForm = z.infer<typeof phoneSchema>;

export const otpSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});
export type OtpForm = z.infer<typeof otpSchema>;

export const profileSetupSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name"),
  dob: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, "Use DD/MM/YYYY"),
  gender: z.enum(["F", "M", "O"]),
  city: z.string().trim().min(2, "City is required"),
  address: z.string().trim().min(6, "Please add a complete address"),
});
export type ProfileSetupForm = z.infer<typeof profileSetupSchema>;

export const bookingDetailsSchema = z.object({
  patientName: z.string().trim().min(2, "Patient name is required"),
  age: z
    .string()
    .regex(/^\d{1,3}$/, "Enter a valid age")
    .refine((v) => Number(v) >= 0 && Number(v) <= 120, "Age must be 0–120"),
  gender: z.enum(["F", "M", "O"]),
  address: z.string().trim().min(6, "Please add a complete address"),
  city: z.string().trim().min(2, "City is required"),
  instructions: z.string().max(500, "Keep instructions under 500 characters"),
});
export type BookingDetailsForm = z.infer<typeof bookingDetailsSchema>;

export const familyInviteSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  relation: z.string().trim().min(2, "Relation is required"),
  phone: z.string().trim().regex(/^\+?\d[\d\s-]{9,14}$/, "Enter a valid phone number"),
});
export type FamilyInviteForm = z.infer<typeof familyInviteSchema>;

export const ticketSchema = z.object({
  subject: z.string().trim().min(4, "Give the ticket a short subject"),
  body: z.string().trim().min(10, "Please describe the issue (10+ characters)"),
});
export type TicketForm = z.infer<typeof ticketSchema>;

/** Anti-bypass guard: chat composer rejects contact-sharing attempts client side. */
const CONTACT_RE =
  /(\+?\d[\d\s().-]{8,}\d)|([\w.+-]+@[\w-]+\.\w{2,})|\b(whatsapp|telegram|instagram|insta|signal)\b/i;

export function containsContactInfo(text: string) {
  return CONTACT_RE.test(text);
}
