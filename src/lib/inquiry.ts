"use server";

import { headers } from "next/headers";
import { getDb, inquiries } from "@/db";
import { countRecentInquiriesByIp } from "@/lib/queries";
import {
  inquirySchema,
  formatIssues,
  type FieldErrors,
} from "@/lib/validation";
import { sendInquiryNotification, sendInquiryConfirmation } from "@/lib/email";
import { site } from "@/lib/site";

/**
 * Enquiry pipeline.
 *
 *   validate -> honeypot -> rate limit -> insert -> notify -> confirm
 *
 * The order is load-bearing. Storage happens before either email, so an
 * email outage costs the notification and never the lead. Email results are
 * logged and deliberately cannot change what the visitor is told.
 *
 * No UI lives here — the contact page is a later phase.
 */

/**
 * What the visitor typed, echoed back on failure.
 *
 * React resets an uncontrolled form once its action resolves, so without this
 * a single validation error emptied every field and the visitor retyped the
 * whole enquiry. The honeypot is deliberately not echoed.
 */
export type SubmittedValues = {
  name: string;
  email: string;
  company: string;
  website: string;
  projectType: string;
  budget: string;
  timeline: string;
  message: string;
};

export type InquiryState =
  | { status: "idle" }
  | {
      status: "error";
      message: string;
      errors?: FieldErrors;
      values?: SubmittedValues;
    }
  | {
      status: "success";
      message: string;
      /**
       * Whether a confirmation actually reached the sender. The UI must not
       * tell someone to watch for an email that was never sent — email is
       * optional configuration here, and it skips silently when absent.
       */
      confirmationSent: boolean;
    };

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;

/**
 * No response-time commitment. The previous wording promised one business day,
 * which has never been confirmed — and a missed promise on the first
 * interaction costs more trust than the promise was ever worth.
 */
const SUCCESS =
  "Thanks — your project details are in, and they go straight to the people who would build it.";

async function clientIp(): Promise<string> {
  const h = await headers();
  // x-forwarded-for is a list; the client is the first entry.
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim().slice(0, 64);
  return h.get("x-real-ip")?.slice(0, 64) ?? "";
}

export async function submitInquiry(
  _prev: InquiryState,
  formData: FormData,
): Promise<InquiryState> {
  const field = (k: string) => String(formData.get(k) ?? "");

  // Kept as typed, so any failure below can hand the form back intact.
  const values: SubmittedValues = {
    name: field("name"),
    email: field("email"),
    company: field("company"),
    website: field("website"),
    projectType: field("projectType"),
    budget: field("budget"),
    timeline: field("timeline"),
    message: field("message"),
  };

  // 1. validate
  const parsed = inquirySchema.safeParse({
    ...values,
    companyWebsite: field("companyWebsite"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      errors: formatIssues(parsed.error),
      values,
    };
  }

  const data = parsed.data;

  // 2. honeypot — report ordinary success and write nothing. A validation
  //    error here would tell a bot it had been detected.
  if (data.companyWebsite) {
    // Mirrors the genuine response exactly, including the flag, so nothing in
    // the reply distinguishes a dropped submission from a stored one.
    return { status: "success", message: SUCCESS, confirmationSent: false };
  }

  const ip = await clientIp();

  // 3. rate limit, counted in the database. Serverless instances share no
  //    memory, so an in-process counter would reset unpredictably.
  if (ip) {
    try {
      const recent = await countRecentInquiriesByIp(ip, RATE_WINDOW_MS);
      if (recent >= RATE_LIMIT) {
        return {
          status: "error",
          message: site.email
            ? `That is a few enquiries in a short time. Email ${site.email} directly and we will pick it up.`
            : "That is a few enquiries in a short time. Try again a little later and it will go through.",
          values,
        };
      }
    } catch (err) {
      // A failing rate-limit check must not block a genuine enquiry.
      console.error("[inquiry] rate-limit check failed", err);
    }
  }

  // 4. store, before any email is attempted
  try {
    await getDb().insert(inquiries).values({
      name: data.name,
      email: data.email,
      company: data.company,
      website: data.website,
      projectType: data.projectType,
      budget: data.budget,
      timeline: data.timeline,
      message: data.message,
      source: "contact-form",
      sourceIp: ip,
    });
  } catch (err) {
    console.error("[inquiry] database write failed", err);
    return {
      status: "error",
      // No dead ends: the site only publishes an address when one is
      // configured, so telling someone to "email us directly" when none is
      // shown sends them nowhere.
      message: site.email
        ? `Something went wrong saving your enquiry. Please try again, or email ${site.email} directly.`
        : "Something went wrong saving your enquiry. Please try again in a moment — the fault is ours, and it is already in our logs.",
      values,
    };
  }

  // 5 + 6. notify and confirm. Neither can fail the request now that the
  //        row is safely stored.
  const [notification, confirmation] = await Promise.all([
    sendInquiryNotification(data, new Date()),
    sendInquiryConfirmation(data),
  ]);
  if (!notification.ok) {
    console.error("[inquiry] notification not sent:", notification.error);
  }
  if (!confirmation.ok) {
    console.error("[inquiry] confirmation not sent:", confirmation.error);
  }

  return {
    status: "success",
    message: SUCCESS,
    confirmationSent: confirmation.ok === true,
  };
}
