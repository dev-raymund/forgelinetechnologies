import "server-only";
import { Resend } from "resend";
import { site } from "@/lib/site";
import type { InquiryData } from "@/lib/validation";
import type { ReviewData } from "@/lib/review-validation";

/**
 * Email delivery for project enquiries.
 *
 * Two rules govern this module:
 *
 *  1. It never throws. Every path returns a SendResult. An enquiry is already
 *     stored by the time these run, and a provider outage must cost the
 *     notification — never the lead.
 *
 *  2. Environment is read lazily, inside the functions. Reading at module
 *     scope would make importing this file enough to fail a build.
 */

export type SendResult = { ok: boolean; skipped?: boolean; error?: string };

function config() {
  const to = process.env.CONTACT_EMAIL ?? "";
  return {
    key: process.env.RESEND_API_KEY ?? "",
    /** Where enquiry notifications land. A personal mailbox is fine here — it
     *  is never shown to anyone, it only receives. */
    to,
    /** The verified sending identity, e.g.
     *  "Forgeline Technologies <notifications@forgelinetechnologies.com>".
     *  The domain must be verified in Resend; the address behind it does not
     *  need a mailbox, because nothing is ever delivered to it. */
    from: process.env.RESEND_FROM ?? "",
    /** Where a visitor's reply to their own confirmation should go. Defaults
     *  to CONTACT_EMAIL so replies are never lost. Set it explicitly once a
     *  forwarded branded address exists, to keep a personal address off the
     *  reply-to header a visitor can see. */
    replyTo: process.env.REPLY_TO || to,
  };
}

/**
 * Resend rejects a send from an unverified domain, and on the free tier it
 * also refuses any recipient other than the account owner. Both are
 * configuration faults rather than outages, so they are worth naming in the
 * logs — a retry will never fix either, and the message Resend returns is not
 * obvious about what to do next.
 */
function explain(message: string): string {
  const m = message.toLowerCase();
  if (
    m.includes("domain") &&
    (m.includes("verif") || m.includes("not found"))
  ) {
    return `${message} — the domain in RESEND_FROM is not verified in Resend. Add it under Domains, complete the DNS records, and wait for it to show as Verified.`;
  }
  if (m.includes("testing emails") || m.includes("own email address")) {
    return `${message} — Resend is still in test mode for this account, so it will only deliver to the address that owns the Resend account. Verify a sending domain to lift this.`;
  }
  return message;
}

/** Everything interpolated below is attacker-controlled and lands in HTML. */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function shell(heading: string, intro: string, body: string): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f2f4f7;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#3c4453;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #e2e6ee;border-top:3px solid #ea580c;border-radius:4px;">
    <tr><td style="padding:30px 30px 0;">
      <p style="margin:0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#7b8494;">${esc(site.name)}</p>
      <h1 style="margin:10px 0 0;font-size:21px;line-height:1.25;color:#16233d;">${esc(heading)}</h1>
      <p style="margin:10px 0 0;font-size:15px;line-height:1.6;">${esc(intro)}</p>
    </td></tr>
    <tr><td style="padding:22px 30px 30px;">${body}</td></tr>
  </table>
</body></html>`;
}

function row(label: string, value: string): string {
  if (!value) return "";
  return `<tr>
    <td style="padding:8px 0;border-bottom:1px solid #eef1f6;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#7b8494;width:38%;vertical-align:top;">${esc(label)}</td>
    <td style="padding:8px 0;border-bottom:1px solid #eef1f6;font-size:14px;color:#16233d;">${esc(value)}</td>
  </tr>`;
}

function messageBlock(message: string): string {
  return `<div style="white-space:pre-wrap;font-size:14px;line-height:1.65;color:#16233d;background:#f7f9fc;border:1px solid #e2e6ee;border-radius:4px;padding:14px;">${esc(message)}</div>`;
}

/**
 * Tells the studio an enquiry arrived.
 *
 * Reply-To is the enquirer, so replying in a mail client answers them
 * directly rather than the sending domain.
 *
 * Requires BOTH the API key and CONTACT_EMAIL — there is nowhere to send it
 * otherwise.
 */
export async function sendInquiryNotification(
  data: InquiryData,
  receivedAt: Date,
): Promise<SendResult> {
  const { key, to, from } = config();
  if (!key || !to || !from) {
    return { ok: false, skipped: true, error: "Email not configured" };
  }

  const details = `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
    ${row("Name", data.name)}
    ${row("Email", data.email)}
    ${row("Company", data.company)}
    ${row("Website", data.website)}
    ${row("Project type", data.projectType)}
    ${row("Budget", data.budget)}
    ${row("Timeline", data.timeline)}
    ${row("Received", receivedAt.toISOString())}
  </table>
  <p style="margin:20px 0 6px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#7b8494;">Message</p>
  ${messageBlock(data.message)}`;

  try {
    const { error } = await new Resend(key).emails.send({
      from,
      to,
      replyTo: data.email,
      subject: `New enquiry — ${data.name}${data.company ? ` (${data.company})` : ""}`,
      html: shell(
        "New project enquiry",
        [data.projectType, data.budget, data.timeline]
          .filter(Boolean)
          .join(" · ") || "No category given",
        details,
      ),
    });
    return error ? { ok: false, error: explain(error.message) } : { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Send failed",
    };
  }
}

/**
 * Acknowledges the enquiry to the person who sent it.
 *
 * Reply-To is CONTACT_EMAIL when set, so a reply reaches the studio. Needs
 * only the API key: a confirmation is still worth sending even if the
 * studio inbox is not configured.
 */
export async function sendInquiryConfirmation(
  data: InquiryData,
): Promise<SendResult> {
  const { key, from, replyTo } = config();
  if (!key || !from) {
    return { ok: false, skipped: true, error: "Email not configured" };
  }

  const body = `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;">Thanks for getting in touch. Your project details have been received and go straight to the developer who would build it.</p>
  ${messageBlock(data.message)}
  <p style="margin:20px 0 0;font-size:15px;line-height:1.65;">If anything has changed in the meantime, just reply to this email.</p>`;

  try {
    const { error } = await new Resend(key).emails.send({
      from,
      to: data.email,
      ...(replyTo ? { replyTo } : {}),
      subject: `We received your enquiry — ${site.name}`,
      html: shell(
        `Thanks, ${data.name.split(" ")[0]}`,
        "Your project details are in. They go straight to the developer who would build it.",
        body,
      ),
    });
    return error ? { ok: false, error: explain(error.message) } : { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Send failed",
    };
  }
}

/**
 * Tells the studio a review arrived.
 *
 * The sender is always the verified domain identity — never the reviewer's
 * address. Letting user-supplied input become the From header is how a contact
 * form turns into an open relay and a domain's reputation into someone else's
 * asset. The reviewer's address goes in Reply-To, where replying reaches them
 * and nothing is claimed on their behalf.
 *
 * No confirmation is sent to the reviewer. They have just been told on screen
 * that it arrived, and a second message implying it is live would be wrong —
 * nothing is published until a person approves it.
 */
export async function sendReviewNotification(
  data: ReviewData,
  context: { id: number; projectTitle?: string },
): Promise<SendResult> {
  const { key, to, from } = config();
  if (!key || !to || !from) {
    return { ok: false, skipped: true, error: "Email not configured" };
  }

  const stars = "\u2605".repeat(data.rating) + "\u2606".repeat(5 - data.rating);
  const details = `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
    ${row("Name", data.name)}
    ${row("Company", data.company)}
    ${row("Email", data.email)}
    ${row("Rating", `${stars}  (${data.rating}/5)`)}
    ${row("Project", context.projectTitle ?? "Not specified")}
    ${row("Permission to publish", data.permissionToPublish ? "Given" : "Not given")}
    ${row("Received", new Date().toISOString())}
  </table>
  <p style="margin:20px 0 6px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#7b8494;">Review</p>
  ${messageBlock(data.body)}
  <p style="margin:20px 0 0;font-size:14px;line-height:1.6;color:#3c4453;">
    Nothing is public yet. Approve or reject it in the dashboard under Reviews.
  </p>`;

  try {
    const { error } = await new Resend(key).emails.send({
      from,
      to,
      // The reviewer, so replying answers them directly.
      replyTo: data.email,
      subject: `New review \u2014 ${data.name}${data.company ? ` (${data.company})` : ""} \u00b7 ${data.rating}/5`,
      html: shell(
        "New client review",
        `${data.rating} out of 5 \u00b7 awaiting moderation`,
        details,
      ),
    });
    return error ? { ok: false, error: explain(error.message) } : { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Send failed",
    };
  }
}
