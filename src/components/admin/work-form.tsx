"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveWork } from "@/lib/admin/work-actions";
import { MediaPicker } from "@/components/admin/media/media-picker";
import type { MediaItem } from "@/lib/media/merge";

export type WorkFormValues = {
  id: number | null;
  title: string;
  slug: string;
  kind: string;
  sector: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  liveUrl: string;
  stack: string;
  overview: string;
  challenge: string;
  approach: string;
  outcome: string;
  status: string;
  featured: boolean;
  sortOrder: number;
};

const KINDS = ["Website", "Web App", "E-commerce", "Custom Build"];
const STATUSES = ["draft", "published", "archived"];

const fieldBase =
  "w-full rounded-sm border border-rule-strong bg-white px-3 py-2 text-[0.9375rem] focus:border-ink focus:outline-none";
const field = `mt-1.5 ${fieldBase}`;

export function WorkForm({
  initial,
  mediaItems,
  mediaError,
}: {
  initial: WorkFormValues;
  mediaItems: MediaItem[];
  mediaError: string | null;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [slug, setSlug] = useState(initial.slug);
  const router = useRouter();
  const slugChanged = Boolean(initial.id) && slug !== initial.slug;

  return (
    <form
      action={(fd) =>
        start(async () => {
          const r = await saveWork(initial.id, fd);
          if (!r.ok) {
            setError(r.error ?? "That did not save.");
            return;
          }
          setError(null);
          router.push("/admin/works");
          router.refresh();
        })
      }
      className="grid gap-6 lg:grid-cols-12"
    >
      {error ? (
        <p role="alert" className="border-l-2 border-accent bg-white px-4 py-3 text-[0.9375rem] lg:col-span-12">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-5 lg:col-span-7">
        <Text name="title" label="Title" defaultValue={initial.title} required />

        <div>
          <Label htmlFor="slug">URL slug</Label>
          <input
            id="slug"
            name="slug"
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className={`${field} font-mono`}
          />
          <p className="mt-1.5 text-[0.8125rem] text-muted">
            Lives at <code>/work/{slug || "…"}</code>
          </p>
          {slugChanged ? (
            // Worth interrupting for: there is no redirect table, so the old
            // address becomes a 404 for anyone who had it.
            <p className="mt-2 border-l-2 border-accent bg-paper px-3 py-2 text-[0.8125rem]">
              Changing the slug breaks the existing URL <code>/work/{initial.slug}</code>.
              Anyone with that link, and any search result pointing at it, gets a 404.
            </p>
          ) : null}
        </div>

        <Area name="description" label="Description" defaultValue={initial.description} rows={4} />
        <Area name="overview" label="Overview (optional)" defaultValue={initial.overview} rows={3} />
        <Area name="challenge" label="Challenge (optional)" defaultValue={initial.challenge} rows={3} />
        <Area name="approach" label="Approach (optional)" defaultValue={initial.approach} rows={3} />
        <Area name="outcome" label="Outcome (optional)" defaultValue={initial.outcome} rows={3} />
      </div>

      <div className="flex flex-col gap-5 lg:col-span-5">
        <Select name="status" label="Status" options={STATUSES} defaultValue={initial.status} />
        <Select name="kind" label="Category" options={KINDS} defaultValue={initial.kind} />
        <Text name="sector" label="Client sector" defaultValue={initial.sector} />

        <div>
          <Label htmlFor="liveUrl">Live site URL</Label>
          <input id="liveUrl" name="liveUrl" defaultValue={initial.liveUrl} className={field} />
          <p className="mt-1.5 text-[0.8125rem] text-muted">
            Leave empty if the site is no longer reachable. The project page then
            says so instead of linking to a dead domain. Never invent a URL.
          </p>
        </div>

        <Text
          name="imageUrl"
          label="Image path"
          defaultValue={initial.imageUrl}
          action={<MediaPicker targetId="imageUrl" items={mediaItems} blobError={mediaError} />}
        />
        <Text name="imageAlt" label="Image alt text" defaultValue={initial.imageAlt} />

        <div>
          <Label htmlFor="stack">Technologies</Label>
          <input id="stack" name="stack" defaultValue={initial.stack} className={field} />
          <p className="mt-1.5 text-[0.8125rem] text-muted">
            Comma separated. Only what the build genuinely used.
          </p>
        </div>

        <Text name="sortOrder" label="Sort order" defaultValue={String(initial.sortOrder)} />

        <label className="flex items-center gap-2.5 text-[0.9375rem]">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={initial.featured}
            className="size-4 accent-[#0d2350]"
          />
          Show on the homepage
        </label>

        <div className="flex gap-2 border-t border-rule pt-5">
          <button
            type="submit"
            disabled={pending}
            className="rounded-sm bg-accent px-5 py-2.5 text-[0.9375rem] font-medium text-white disabled:opacity-60"
          >
            {pending ? "Saving…" : initial.id ? "Save changes" : "Create project"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/works")}
            className="rounded-sm border border-rule-strong px-5 py-2.5 text-[0.9375rem] font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-[0.875rem] font-medium text-graphite">
      {children}
    </label>
  );
}

function Text({
  name,
  label,
  defaultValue,
  required,
  action,
}: {
  name: string;
  label: string;
  defaultValue: string;
  required?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      {/* The margin sits on this row, not on the input inside it — an input
          and its action button are siblings in a flex row, and a margin on
          only one of them (as `field` alone would put here) pushes it down
          without moving the other, so the two go out of top-alignment. One
          shared offset on the row keeps every field's label-to-control gap
          identical to before, and additionally top-aligns the action. */}
      <div className="mt-1.5 flex items-start gap-2">
        <input id={name} name={name} defaultValue={defaultValue} required={required} className={`${fieldBase} flex-1`} />
        {action}
      </div>
    </div>
  );
}

function Area({
  name,
  label,
  defaultValue,
  rows,
}: {
  name: string;
  label: string;
  defaultValue: string;
  rows: number;
}) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <textarea id={name} name={name} defaultValue={defaultValue} rows={rows} className={field} />
    </div>
  );
}

function Select({
  name,
  label,
  options,
  defaultValue,
}: {
  name: string;
  label: string;
  options: string[];
  defaultValue: string;
}) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <select id={name} name={name} defaultValue={defaultValue} className={field}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
