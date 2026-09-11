import { z } from "zod";

/**
 * Option lists live beside the schema so a form's <select> and the validator
 * can never drift apart. Exported for the contact UI, which is a later phase.
 */
export const PROJECT_TYPES = [
  "Website",
  "Web application",
  "E-commerce",
  "API / integration",
  "Custom software",
  "Ongoing development",
  "Not sure yet",
] as const;

export const BUDGETS = [
  "Under $1,000",
  "$1,000 – $5,000",
  "$5,000 – $15,000",
  "$15,000+",
  "Not sure yet",
] as const;

const trimmed = z.string().trim();

export const inquirySchema = z.object({
  name: trimmed.min(2, "Please enter your name.").max(150, "That name is too long."),
  email: trimmed
    .max(255, "That email is too long.")
    .pipe(z.email("Enter a valid email address.")),
  company: trimmed.max(200, "That company name is too long.").optional().default(""),
  // Accepts a bare domain as well as a full URL — people type both.
  website: trimmed
    .max(300, "That URL is too long.")
    .refine((v) => v === "" || /^([a-z][a-z0-9+.-]*:\/\/)?[^\s.]+\.[^\s]{2,}$/i.test(v), {
      message: "Enter a valid website address.",
    })
    .optional()
    .default(""),
  projectType: z
    .union([z.enum(PROJECT_TYPES), z.literal("")])
    .optional()
    .default(""),
  budget: z.union([z.enum(BUDGETS), z.literal("")]).optional().default(""),
  message: trimmed
    .min(20, "A sentence or two about the project, please.")
    .max(5000, "That message is too long."),
  /**
   * Honeypot. Deliberately NOT rejected here — a validation error would tell
   * a bot it had been detected. It parses normally and the pipeline drops the
   * submission after a successful parse.
   */
  companyWebsite: trimmed.max(300).optional().default(""),
});

export type InquiryInput = z.input<typeof inquirySchema>;
export type InquiryData = z.output<typeof inquirySchema>;

/** Field-keyed errors, the shape a form renders directly. */
export type FieldErrors = Partial<Record<keyof InquiryData, string>>;

export function formatIssues(error: z.ZodError<InquiryData>): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as keyof InquiryData | undefined;
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}
