/**
 * The enquiry pipeline.
 *
 * Split out of inquiries.ts because that module is "server-only" and the
 * status buttons render on the client. Plain data, no imports — safe in both.
 */
export const INQUIRY_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "won",
  "lost",
] as const;

export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

export function isInquiryStatus(v: string): v is InquiryStatus {
  return (INQUIRY_STATUSES as readonly string[]).includes(v);
}
