import { z } from "zod";

/**
 * Client review submissions.
 *
 * `permissionToPublish` is a required literal `true` rather than an optional
 * flag. Publishing someone's words and their employer's name without it is not
 * a mistake we want to be one admin click away from, so the schema refuses the
 * submission outright instead of storing an unusable review.
 */

export const RATINGS = [1, 2, 3, 4, 5] as const;

const trimmed = z.string().trim();

export const reviewSchema = z.object({
  name: trimmed
    .min(2, "Please enter your name.")
    .max(150, "That name is too long."),
  company: trimmed.max(200, "That company name is too long.").optional().default(""),
  email: trimmed
    .max(255, "That email is too long.")
    .pipe(z.email("Enter a valid email address.")),
  rating: z.coerce
    .number()
    .int()
    .min(1, "Choose a rating.")
    .max(5, "Choose a rating."),
  body: trimmed
    .min(20, "Please add a little more detail — at least 20 characters.")
    .max(4000, "That review is too long."),
  /** Optional: a review does not have to be about a listed project. */
  projectId: z
    .union([z.coerce.number().int().positive(), z.literal("")])
    .optional()
    .transform((v) => (typeof v === "number" ? v : null)),
  permissionToPublish: z.literal(true, {
    message: "We can only use your review with your permission.",
  }),
  /**
   * Honeypot. Deliberately NOT rejected here — a validation error would tell
   * a bot it had been detected. It parses normally and the pipeline drops the
   * submission after a successful parse, exactly as the contact form does.
   */
  website: trimmed.max(300).optional().default(""),
});

export type ReviewInput = z.input<typeof reviewSchema>;
export type ReviewData = z.output<typeof reviewSchema>;

export type ReviewFieldErrors = Partial<Record<keyof ReviewData, string>>;

export function formatReviewIssues(
  error: z.ZodError<ReviewData>,
): ReviewFieldErrors {
  const out: ReviewFieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as keyof ReviewData | undefined;
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}
