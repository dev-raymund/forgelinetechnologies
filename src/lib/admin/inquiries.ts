import "server-only";
import { and, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { getDb, inquiries, inquiryNotes, users } from "@/db";
import { withRetry } from "@/lib/queries";

/**
 * Enquiry triage.
 *
 * A pipeline, not a CRM. The statuses are the few states that change what
 * someone does next; anything finer would be recorded and never used. They
 * live in inquiry-statuses.ts so the client buttons can import them too.
 */
export {
  INQUIRY_STATUSES,
  isInquiryStatus,
  type InquiryStatus,
} from "@/lib/admin/inquiry-statuses";
import { isInquiryStatus } from "@/lib/admin/inquiry-statuses";

const PAGE_SIZE = 25;

export async function listInquiries(opts: {
  q?: string;
  status?: string;
  page?: number;
}) {
  const page = Math.max(1, opts.page ?? 1);
  const filters: SQL[] = [];

  if (opts.status && isInquiryStatus(opts.status)) {
    filters.push(eq(inquiries.status, opts.status));
  }
  if (opts.q?.trim()) {
    // Escape the LIKE wildcards so a search for "100%" is not a match-all.
    const term = `%${opts.q.trim().replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
    filters.push(
      or(
        ilike(inquiries.name, term),
        ilike(inquiries.email, term),
        ilike(inquiries.company, term),
        ilike(inquiries.message, term),
      )!,
    );
  }
  const where = filters.length ? and(...filters) : undefined;

  const [rows, total] = await Promise.all([
    withRetry(() =>
      getDb()
        .select()
        .from(inquiries)
        .where(where)
        .orderBy(desc(inquiries.createdAt))
        .limit(PAGE_SIZE)
        .offset((page - 1) * PAGE_SIZE),
    ),
    withRetry(() =>
      getDb().select({ n: count() }).from(inquiries).where(where),
    ),
  ]);

  const n = total[0]?.n ?? 0;
  return { rows, total: n, page, pages: Math.max(1, Math.ceil(n / PAGE_SIZE)) };
}

export async function getInquiry(id: number) {
  const rows = await withRetry(() =>
    getDb().select().from(inquiries).where(eq(inquiries.id, id)).limit(1),
  );
  return rows[0];
}

export async function getInquiryNotes(inquiryId: number) {
  return withRetry(() =>
    getDb()
      .select({
        id: inquiryNotes.id,
        body: inquiryNotes.body,
        createdAt: inquiryNotes.createdAt,
        authorName: users.name,
        authorEmail: users.email,
      })
      .from(inquiryNotes)
      .leftJoin(users, eq(inquiryNotes.authorId, users.id))
      .where(eq(inquiryNotes.inquiryId, inquiryId))
      .orderBy(desc(inquiryNotes.createdAt)),
  );
}

/** Counts per status, for the filter chips. One query, not six. */
export async function inquiryStatusCounts(): Promise<Record<string, number>> {
  const rows = await withRetry(() =>
    getDb()
      .select({ status: inquiries.status, n: count() })
      .from(inquiries)
      .groupBy(inquiries.status),
  );
  return Object.fromEntries(rows.map((r) => [r.status, r.n]));
}
