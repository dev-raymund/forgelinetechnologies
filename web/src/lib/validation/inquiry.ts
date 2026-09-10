import { z } from "zod";

/**
 * Mirrors the lead form in the live design exactly.
 *
 * The option strings below are the ones already rendered on the site — the
 * schema was adapted to the form rather than the form to the schema, so the
 * visible design and copy are untouched. `_gotcha` is the honeypot that markup
 * already carried.
 */
export const PROJECT_TYPES = [
  "Web app / MVP (Web App Build)",
  "Website / landing page (Site Sprint)",
  "E-commerce / online store",
  "Ongoing work (Build Partner)",
  "Care plan / maintenance",
  "Not sure yet",
] as const;

export const BUDGETS = [
  "Under $1,000",
  "$1,000–$5,000",
  "$5,000–$15,000",
  "$15,000+",
] as const;

const trimmed = z.string().trim();

export const inquirySchema = z.object({
  name: trimmed.min(2, "Please enter your name.").max(150, "That name is too long."),
  email: trimmed.email("Enter a valid email address.").max(250, "That email is too long."),
  // Both selects allow an empty first option in the markup, so neither is
  // required — an enquiry with only a name, email and message is still a lead.
  product: z
    .union([z.enum(PROJECT_TYPES), z.literal("")])
    .optional()
    .default(""),
  budget: z
    .union([z.enum(BUDGETS), z.literal("")])
    .optional()
    .default(""),
  message: trimmed
    .min(10, "A sentence or two about the project, please.")
    .max(5000, "That message is too long."),
  /* Honeypot. Not rejected here: a validation error would tell the bot it was
     caught. The server action checks it after a successful parse and returns a
     normal success response without writing anything. */
  _gotcha: z.string().max(300).optional().default(""),
});

export type InquiryInput = z.input<typeof inquirySchema>;
export type InquiryParsed = z.output<typeof inquirySchema>;

/** Field-keyed errors, the shape the form renders directly. */
export type FieldErrors = Partial<Record<keyof InquiryParsed, string>>;

export function formatIssues(error: z.ZodError<InquiryParsed>): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as keyof InquiryParsed | undefined;
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}
