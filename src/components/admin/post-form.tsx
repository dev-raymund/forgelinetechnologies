"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { savePost } from "@/lib/admin/post-actions";

export type PostFormValues = {
  id: number | null;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  coverUrl: string;
  seoTitle: string;
  seoDescription: string;
  ogImage: string;
  status: string;
};

const field =
  "mt-1.5 w-full rounded-sm border border-rule-strong bg-white px-3 py-2 text-[0.9375rem] focus:border-ink focus:outline-none";

/** Slugify as you type, but only for a new post — never silently move a URL. */
function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 250);
}

export function PostForm({
  initial,
  preview,
}: {
  initial: PostFormValues;
  /** Rendered server-side from the saved body, so the preview uses the same
      renderer the public page will — not a second implementation. */
  preview: string;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(initial.title);
  const [slug, setSlug] = useState(initial.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.slug));
  const [tab, setTab] = useState<"write" | "preview">("write");
  const router = useRouter();

  const slugChanged = Boolean(initial.id) && slug !== initial.slug;

  return (
    <form
      action={(fd) =>
        start(async () => {
          const r = await savePost(initial.id, fd);
          if (!r.ok) {
            setError(r.error ?? "That did not save.");
            return;
          }
          setError(null);
          router.push("/admin/blog");
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

      <div className="flex flex-col gap-5 lg:col-span-8">
        <div>
          <label htmlFor="title" className="text-[0.875rem] font-medium">Title</label>
          <input
            id="title"
            name="title"
            required
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
            className={field}
          />
        </div>

        <div>
          <label htmlFor="slug" className="text-[0.875rem] font-medium">URL slug</label>
          <input
            id="slug"
            name="slug"
            required
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            className={`${field} font-mono`}
          />
          <p className="mt-1.5 text-[0.8125rem] text-muted">
            Lives at <code>/blog/{slug || "…"}</code>
          </p>
          {slugChanged ? (
            <p className="mt-2 border-l-2 border-accent bg-paper px-3 py-2 text-[0.8125rem]">
              Changing the slug breaks <code>/blog/{initial.slug}</code> for anyone
              who already has that link.
            </p>
          ) : null}
        </div>

        <div>
          <div className="flex gap-1.5">
            {(["write", "preview"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                aria-pressed={tab === t}
                className={`rounded-sm px-3 py-1.5 font-mono text-micro ${
                  tab === t ? "bg-ink text-white" : "border border-rule-strong bg-white text-muted"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div hidden={tab !== "write"}>
            <label htmlFor="body" className="sr-only">Body</label>
            <textarea
              id="body"
              name="body"
              rows={22}
              defaultValue={initial.body}
              placeholder={"# A heading\n\nA paragraph, with **bold**, *italic*, a [link](https://example.com) and `code`.\n\n- a list item\n\n> a quotation"}
              className={`${field} font-mono text-[0.875rem] leading-relaxed`}
            />
            <p className="mt-1.5 text-[0.8125rem] text-muted">
              Markdown. Raw HTML is escaped rather than rendered, so anything in
              angle brackets appears as text.
            </p>
          </div>

          <div hidden={tab !== "preview"} className="mt-1.5">
            {preview ? (
              <div
                className="prose-admin rounded-sm border border-rule bg-white px-5 py-4"
                dangerouslySetInnerHTML={{ __html: preview }}
              />
            ) : (
              <p className="rounded-sm border border-dashed border-rule-strong bg-white px-5 py-8 text-center text-[0.9375rem] text-muted">
                Save the post to see a preview. It renders with exactly the same
                function the public page uses.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5 lg:col-span-4">
        <div>
          <label htmlFor="status" className="text-[0.875rem] font-medium">Status</label>
          <select id="status" name="status" defaultValue={initial.status} className={field}>
            {["draft", "published", "archived"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <p className="mt-1.5 text-[0.8125rem] text-muted">
            Only published posts appear on the site or in the sitemap.
          </p>
        </div>

        <div>
          <label htmlFor="excerpt" className="text-[0.875rem] font-medium">Excerpt</label>
          <textarea id="excerpt" name="excerpt" rows={3} defaultValue={initial.excerpt} className={field} />
          <p className="mt-1.5 text-[0.8125rem] text-muted">
            Optional. Falls back to the opening of the post.
          </p>
        </div>

        <div>
          <label htmlFor="coverUrl" className="text-[0.875rem] font-medium">Cover image</label>
          <input id="coverUrl" name="coverUrl" defaultValue={initial.coverUrl} className={field} />
        </div>

        <fieldset className="border-t border-rule pt-4">
          <legend className="font-mono text-micro text-faint">SEO — all optional</legend>
          <div className="mt-3 flex flex-col gap-4">
            <div>
              <label htmlFor="seoTitle" className="text-[0.875rem] font-medium">Search title</label>
              <input id="seoTitle" name="seoTitle" defaultValue={initial.seoTitle} className={field} />
            </div>
            <div>
              <label htmlFor="seoDescription" className="text-[0.875rem] font-medium">Search description</label>
              <textarea id="seoDescription" name="seoDescription" rows={3} defaultValue={initial.seoDescription} className={field} />
            </div>
            <div>
              <label htmlFor="ogImage" className="text-[0.875rem] font-medium">Social image</label>
              <input id="ogImage" name="ogImage" defaultValue={initial.ogImage} className={field} />
            </div>
          </div>
          <p className="mt-3 text-[0.8125rem] text-muted">
            Leave these empty and the page derives them from the title, excerpt
            and cover image.
          </p>
        </fieldset>

        <div className="flex gap-2 border-t border-rule pt-5">
          <button
            type="submit"
            disabled={pending}
            className="rounded-sm bg-accent px-5 py-2.5 text-[0.9375rem] font-medium text-white disabled:opacity-60"
          >
            {pending ? "Saving…" : initial.id ? "Save changes" : "Create post"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/blog")}
            className="rounded-sm border border-rule-strong px-5 py-2.5 text-[0.9375rem] font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
