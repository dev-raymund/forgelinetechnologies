import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCapability, roleHas } from "@/lib/auth/guard";
import { getInquiry, getInquiryNotes } from "@/lib/admin/inquiries";
import { PageTitle, Status, when } from "@/components/admin/ui";
import { InquiryControls } from "@/components/admin/inquiry-controls";

export const metadata = { title: "Inquiry" };

export default async function InquiryDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: raw } = await params;
  const id = Number(raw);
  const user = await requireCapability("inquiries.manage", `/admin/inquiries/${raw}`);
  if (!Number.isInteger(id) || id < 1) notFound();

  const inquiry = await getInquiry(id);
  if (!inquiry) notFound();
  const notes = await getInquiryNotes(id);

  const facts: [string, string][] = [
    ["Email", inquiry.email],
    ["Company", inquiry.company || "—"],
    ["Website", inquiry.website || "—"],
    ["Project type", inquiry.projectType || "—"],
    ["Budget", inquiry.budget || "—"],
    ["Timeline", inquiry.timeline || "—"],
    ["Source", inquiry.source || "—"],
    ["Received", when(inquiry.createdAt)],
  ];

  return (
    <>
      <Link
        href="/admin/inquiries"
        className="mb-4 inline-block text-[0.875rem] text-muted underline decoration-rule-strong underline-offset-4 hover:text-graphite"
      >
        ← All inquiries
      </Link>

      <PageTitle
        title={inquiry.name}
        count={`Enquiry #${inquiry.id}`}
        action={<Status value={inquiry.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <section className="rounded-sm border border-rule bg-white p-5">
            <h2 className="text-[1.0625rem] font-semibold">Message</h2>
            <p className="mt-3 whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-graphite">
              {inquiry.message}
            </p>
            <p className="mt-5 border-t border-rule pt-4 text-[0.875rem] text-muted">
              Reply directly:{" "}
              <a
                href={`mailto:${inquiry.email}?subject=${encodeURIComponent(`Re: your enquiry — Forgeline`)}`}
                className="font-medium text-graphite underline decoration-rule-strong underline-offset-4 hover:decoration-accent"
              >
                {inquiry.email}
              </a>
            </p>
          </section>

          <section className="mt-6 rounded-sm border border-rule bg-white p-5">
            <h2 className="text-[1.0625rem] font-semibold">
              Notes{notes.length ? ` (${notes.length})` : ""}
            </h2>
            <InquiryControls
              id={inquiry.id}
              status={inquiry.status}
              canDelete={roleHas(user.role, "users.manage")}
              mode="notes"
            />
            {notes.length === 0 ? (
              <p className="mt-4 text-[0.9375rem] text-muted">
                No notes yet. These are internal and never leave the dashboard.
              </p>
            ) : (
              <ul className="mt-5 flex flex-col gap-4">
                {notes.map((n) => (
                  <li key={n.id} className="border-t border-rule pt-3">
                    <p className="whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-graphite">
                      {n.body}
                    </p>
                    <p className="mt-1.5 font-mono text-micro text-faint">
                      {n.authorName || n.authorEmail || "Unknown"} · {when(n.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="lg:col-span-5">
          <section className="rounded-sm border border-rule bg-white p-5">
            <h2 className="text-[1.0625rem] font-semibold">Details</h2>
            <dl className="mt-4 flex flex-col gap-3">
              {facts.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[8rem_1fr] gap-3">
                  <dt className="font-mono text-micro text-faint">{k}</dt>
                  <dd className="min-w-0 break-words text-[0.9375rem] text-graphite">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="mt-6 rounded-sm border border-rule bg-white p-5">
            <h2 className="text-[1.0625rem] font-semibold">Stage</h2>
            <InquiryControls
              id={inquiry.id}
              status={inquiry.status}
              canDelete={roleHas(user.role, "users.manage")}
              mode="status"
            />
          </section>
        </div>
      </div>
    </>
  );
}
