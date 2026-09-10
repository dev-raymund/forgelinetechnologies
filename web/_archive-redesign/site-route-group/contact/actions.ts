"use server";

import { headers } from "next/headers";
import { and, eq, gte, sql } from "drizzle-orm";
import { db, projectInquiries } from "@/db";
import { inquirySchema, formatIssues, type FieldErrors } from "@/lib/validation/inquiry";
import { sendInquiryNotification, sendInquiryConfirmation } from "@/lib/email/inquiry";

export type InquiryState =
  | { status: "idle" }
  | { status: "error"; message: string; errors?: FieldErrors }
  | { status: "success"; message: string };

const MAX_PER_IP_PER_HOUR = 5;

async function clientIp(): Promise<string> {
  const h = await headers();
  // x-forwarded-for is a list; the client is the first entry.
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim().slice(0, 64);
  return h.get("x-real-ip")?.slice(0, 64) ?? "";
}

export async function submitInquiry(
  _prev: InquiryState,
  formData: FormData,
): Promise<InquiryState> {
  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    company: String(formData.get("company") ?? ""),
    website: String(formData.get("website") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    projectType: String(formData.get("projectType") ?? ""),
    budget: String(formData.get("budget") ?? ""),
    timeline: String(formData.get("timeline") ?? ""),
    message: String(formData.get("message") ?? ""),
    companyUrl: String(formData.get("companyUrl") ?? ""),
  };

  const parsed = inquirySchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      errors: formatIssues(parsed.error),
    };
  }

  const data = parsed.data;

  // Honeypot filled means a bot. Report success so it doesn't retry, and
  // write nothing.
  if (data.companyUrl) {
    return { status: "success", message: "Thanks — we'll be in touch shortly." };
  }

  const ip = await clientIp();

  // Rate limit in the database rather than in memory: serverless instances
  // don't share memory, so an in-process counter would reset constantly.
  if (ip) {
    try {
      const since = new Date(Date.now() - 60 * 60 * 1000);
      const [{ n }] = await db
        .select({ n: sql<number>`count(*)::int` })
        .from(projectInquiries)
        .where(and(eq(projectInquiries.sourceIp, ip), gte(projectInquiries.createdAt, since)));
      if (n >= MAX_PER_IP_PER_HOUR) {
        return {
          status: "error",
          message: "That's a few enquiries in a short time. Email us directly and we'll pick it up.",
        };
      }
    } catch {
      // A failed rate-limit check must not block a real enquiry.
    }
  }

  // Store first: an email provider outage should cost the notification, not
  // the lead.
  try {
    await db.insert(projectInquiries).values({
      name: data.name,
      email: data.email,
      company: data.company,
      website: data.website,
      phone: data.phone,
      projectType: data.projectType,
      budget: data.budget,
      timeline: data.timeline,
      message: data.message,
      sourceIp: ip,
    });
  } catch (err) {
    console.error("[inquiry] database write failed", err);
    return {
      status: "error",
      message: "Something went wrong saving your enquiry. Please email us directly.",
    };
  }

  // Notification matters more than the confirmation; neither can fail the
  // submission now that the row is safely stored.
  const [notify, confirm] = await Promise.all([
    sendInquiryNotification(data, new Date()),
    sendInquiryConfirmation(data),
  ]);
  if (!notify.ok) console.error("[inquiry] notification not sent:", notify.error);
  if (!confirm.ok) console.error("[inquiry] confirmation not sent:", confirm.error);

  return {
    status: "success",
    message: "Thanks — your enquiry is in. You'll hear back within one business day.",
  };
}
