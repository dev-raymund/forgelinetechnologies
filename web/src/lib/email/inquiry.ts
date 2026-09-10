import "server-only";
import { Resend } from "resend";
import type { InquiryParsed } from "@/lib/validation/inquiry";
import { site } from "@/lib/content";

/* Env is read lazily inside the functions, never at module scope: importing
   this file must not throw during build when the key isn't configured. */
const FROM = process.env.RESEND_FROM || "Forgeline <onboarding@resend.dev>";
const TO = process.env.CONTACT_EMAIL || "";

/** Everything interpolated into the HTML below is user-supplied. */
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
<body style="margin:0;background:#f0f3f8;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#485166;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e7f0;border-radius:3px;">
    <tr><td style="padding:32px 32px 0;">
      <p style="margin:0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#78819a;">${esc(site.name)}</p>
      <h1 style="margin:12px 0 0;font-size:22px;line-height:1.25;color:#0a1020;">${esc(heading)}</h1>
      <p style="margin:12px 0 0;font-size:15px;line-height:1.6;">${esc(intro)}</p>
    </td></tr>
    <tr><td style="padding:24px 32px 32px;">${body}</td></tr>
    <tr><td style="padding:0 32px 28px;border-top:1px solid #e2e7f0;">
      <p style="margin:18px 0 0;font-size:12px;color:#78819a;">${esc(site.name)} · ${esc(site.url)}</p>
    </td></tr>
  </table>
</body></html>`;
}

function row(label: string, value: string): string {
  if (!value) return "";
  return `<tr>
    <td style="padding:9px 0;border-bottom:1px solid #f0f3f8;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#78819a;width:38%;vertical-align:top;">${esc(label)}</td>
    <td style="padding:9px 0;border-bottom:1px solid #f0f3f8;font-size:14px;color:#0a1020;">${esc(value)}</td>
  </tr>`;
}

export type SendResult = { ok: boolean; skipped?: boolean; error?: string };

/** Internal notification. Reply-To is the enquirer, so replying just works. */
export async function sendInquiryNotification(
  data: InquiryParsed,
  receivedAt: Date,
): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key || !TO) return { ok: false, skipped: true, error: "Email not configured" };

  const details = `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
    ${row("Name", data.name)}
    ${row("Email", data.email)}
    ${row("What they need", data.product)}
    ${row("Budget", data.budget)}
    ${row("Received", receivedAt.toISOString())}
  </table>
  <p style="margin:22px 0 6px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#78819a;">Project details</p>
  <div style="white-space:pre-wrap;font-size:14px;line-height:1.65;color:#0a1020;background:#f8f9fb;border:1px solid #e2e7f0;border-radius:3px;padding:14px;">${esc(data.message)}</div>`;

  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from: FROM,
      to: TO,
      replyTo: data.email,
      subject: `New enquiry — ${data.name}`,
      html: shell(
        "New project enquiry",
        [data.product, data.budget].filter(Boolean).join(" · ") || "No category given",
        details,
      ),
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Send failed" };
  }
}

/** Confirmation to the enquirer. Never blocks the submission. */
export async function sendInquiryConfirmation(data: InquiryParsed): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, skipped: true, error: "Email not configured" };

  const body = `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;">Thanks for getting in touch. Your enquiry is with us and you'll get a reply within one business day.</p>
  <p style="margin:0 0 16px;font-size:15px;line-height:1.65;">Here's what you sent:</p>
  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
    ${row("What you need", data.product)}
    ${row("Budget", data.budget)}
  </table>
  <div style="margin-top:14px;white-space:pre-wrap;font-size:14px;line-height:1.65;color:#0a1020;background:#f8f9fb;border:1px solid #e2e7f0;border-radius:3px;padding:14px;">${esc(data.message)}</div>
  <p style="margin:22px 0 0;font-size:15px;line-height:1.65;">If anything's changed in the meantime, just reply to this email.</p>`;

  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from: FROM,
      to: data.email,
      ...(TO ? { replyTo: TO } : {}),
      subject: `We got your enquiry — ${site.name}`,
      html: shell(`Thanks, ${data.name.split(" ")[0]}`, "We'll be in touch within one business day.", body),
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Send failed" };
  }
}
