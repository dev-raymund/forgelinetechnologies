"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { deleteMedia } from "@/lib/media/actions";
import {
  ALLOWED_UPLOAD_TYPES,
  MAX_UPLOAD_BYTES,
  blobPathname,
  isAllowedUpload,
} from "@/lib/media/paths";
import type { MediaItem } from "@/lib/media/merge";
import { Empty } from "@/components/admin/ui";

/**
 * The upload accept list and the client's own pre-check both come from
 * `ALLOWED_UPLOAD_TYPES`, never a hand-typed string, so the browser's file
 * picker and the "is this allowed" check can never drift from the server's
 * allow-list. The upload route re-validates regardless — this is feedback,
 * not the guarantee.
 */
const ACCEPT = ALLOWED_UPLOAD_TYPES.join(",");

const field =
  "w-full rounded-sm border border-rule-strong bg-white px-3 py-2 text-[0.9375rem] focus:border-ink focus:outline-none";

/**
 * `upload()` from `@vercel/blob/client` throws this exact string (double
 * space and all — it's the library's own typo) for *any* non-OK response to
 * the token request, so the route's actual reason — not authorised, file
 * name rejected, session expired — never reaches the admin. Matched
 * case-insensitively, with `\s+` standing in for the double space so a fix
 * upstream doesn't silently break this match.
 */
const TOKEN_REQUEST_FAILED = /retrieve\s+the\s+client\s+token/i;

function uploadErrorMessage(error: unknown, filename: string): string {
  if (error instanceof Error) {
    if (TOKEN_REQUEST_FAILED.test(error.message)) {
      return "The upload was refused. Your session may have expired — sign in again — or the file was not accepted.";
    }
    return error.message;
  }
  return `${filename} could not be uploaded.`;
}

type UploadStatus = "uploading" | "done" | "error";

type UploadEntry = {
  key: string;
  name: string;
  progress: number;
  status: UploadStatus;
  error?: string;
};

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

let nextKey = 0;

/**
 * The media library grid: dropzone, search, and the item grid itself.
 *
 * Reused two ways. With no `onSelect` it is the full manage view on
 * `/admin/media` — delete, copy-to-clipboard, everything. With `onSelect` it
 * becomes a picker embedded in another form (blog posts, works): clicking an
 * item hands back its URL instead of copying it, and the delete/copy affordances
 * disappear, since a picker should not double as a destructive control.
 */
export function MediaLibrary({
  items,
  blobError,
  onSelect,
}: {
  items: MediaItem[];
  blobError: string | null;
  onSelect?: (url: string) => void;
}) {
  const router = useRouter();
  const manageMode = !onSelect;
  const uploadDisabled = Boolean(blobError);

  const [query, setQuery] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadEntry[]>([]);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<{ message: string; url: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.name.toLowerCase().includes(q));
  }, [items, query]);

  const setEntry = useCallback((key: string, patch: Partial<UploadEntry>) => {
    setUploads((prev) => prev.map((entry) => (entry.key === key ? { ...entry, ...patch } : entry)));
  }, []);

  /**
   * Files upload one at a time, in the order given. A `for...of` with `await`
   * on each iteration — not `Promise.all` — so a batch of twenty photos opens
   * one connection at a time instead of twenty at once, and so a failure on
   * file three does not race with, or get lost among, files four through
   * twenty. Each file's try/catch is scoped to that file alone: one failure
   * is recorded against that entry and the loop moves on to the next file
   * rather than aborting the whole batch.
   */
  const handleFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      if (files.length === 0 || uploadDisabled) return;

      const batch = files.map((file) => ({
        file,
        key: `u${nextKey++}`,
      }));

      setUploads((prev) => [
        ...prev,
        ...batch.map(({ file, key }) => ({ key, name: file.name, progress: 0, status: "uploading" as const })),
      ]);

      for (const { file, key } of batch) {
        if (!isAllowedUpload(file.type, file.size)) {
          const reason =
            file.size > MAX_UPLOAD_BYTES ? "is larger than 8 MB" : "is not an allowed image type";
          setEntry(key, { status: "error", error: `${file.name} ${reason}.` });
          continue;
        }

        try {
          const pathname = blobPathname(file.name);
          await upload(pathname, file, {
            access: "public",
            handleUploadUrl: "/api/media/upload",
            contentType: file.type,
            onUploadProgress: ({ percentage }) => setEntry(key, { progress: percentage }),
          });
          setEntry(key, { status: "done", progress: 100 });
        } catch (error) {
          setEntry(key, { status: "error", error: uploadErrorMessage(error, file.name) });
        }
      }

      router.refresh();
    },
    [router, setEntry, uploadDisabled],
  );

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    // Without preventDefault() here the browser's own drop handling takes
    // over and navigates to the dropped file instead of handing it to us.
    event.preventDefault();
    if (uploadDisabled) return;
    setDragging(true);
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (uploadDisabled) return;
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    if (uploadDisabled) return;
    if (event.dataTransfer.files.length) void handleFiles(event.dataTransfer.files);
  };

  const openPicker = () => {
    if (!uploadDisabled) inputRef.current?.click();
  };

  /**
   * A drop anywhere in this component that is not the dropzone above must not
   * fall through to the browser's default of opening the dropped file — in
   * Firefox that replaces the tab outright, losing whatever the surrounding
   * form (a blog post, a work) had unsaved. This only calls preventDefault():
   * it never reads `dataTransfer` (so it cannot swallow files meant for the
   * dropzone's own handler) and never calls stopPropagation() (so, during the
   * bubble phase, the dropzone's own onDrop above still runs first and still
   * receives the files — this handler only catches what reaches the root
   * afterwards).
   */
  const blockStrayDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleCopy = useCallback(async (url: string) => {
    setCopyError(null);
    // navigator.clipboard is undefined outside a secure context (plain HTTP,
    // some embedded webviews), and writeText can reject even when it exists
    // (no permission, no focus). Both paths must degrade to a message, not a
    // thrown error. Neither the browser chrome nor this page shows the URL
    // anywhere else, so the message carries it as selectable text — on
    // /admin/media the address bar reads /admin/media, not the image, so
    // pointing someone there was never actually true.
    if (!navigator.clipboard) {
      setCopyError({
        message: "Could not copy automatically. Select the image and copy its URL from the link instead.",
        url,
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      window.setTimeout(() => setCopiedUrl((prev) => (prev === url ? null : prev)), 2000);
    } catch {
      setCopyError({
        message: "Could not copy automatically. Select the image and copy its URL from the link instead.",
        url,
      });
    }
  }, []);

  const allSettled = uploads.length > 0 && uploads.every((u) => u.status !== "uploading");

  return (
    <div onDragOver={blockStrayDrop} onDrop={blockStrayDrop}>
      {blobError ? (
        <p role="alert" className="mb-5 border-l-2 border-accent bg-white px-4 py-3 text-[0.9375rem]">
          {blobError}
        </p>
      ) : null}

      {copyError ? (
        <p role="alert" className="mb-5 border-l-2 border-accent bg-white px-4 py-3 text-[0.9375rem]">
          {copyError.message}{" "}
          <span className="select-all break-all font-mono text-[0.8125rem] text-graphite">
            {copyError.url}
          </span>
        </p>
      ) : null}

      <div
        onClick={openPicker}
        onKeyDown={(event) => {
          if (uploadDisabled) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openPicker();
          }
        }}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        tabIndex={uploadDisabled ? -1 : 0}
        aria-disabled={uploadDisabled}
        className={`rounded-sm border border-dashed px-5 py-10 text-center transition-colors ${
          uploadDisabled
            ? "cursor-not-allowed border-rule bg-black/[0.02] text-faint"
            : dragging
              ? "cursor-pointer border-accent bg-accent/5"
              : "cursor-pointer border-rule-strong bg-white hover:border-ink"
        }`}
      >
        <p className="text-[0.9375rem] font-medium text-graphite">
          {uploadDisabled ? "Uploads are unavailable" : "Drag images here, or click to browse"}
        </p>
        <p className="mt-1 text-[0.8125rem] text-muted">
          PNG, JPEG, WebP, AVIF or GIF — up to {Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))} MB each.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          disabled={uploadDisabled}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => {
            if (event.target.files?.length) void handleFiles(event.target.files);
            event.target.value = "";
          }}
          className="hidden"
        />
      </div>

      {uploads.length > 0 ? (
        <div className="mt-4">
          <ul className="flex flex-col gap-2">
            {uploads.map((entry) => (
              <li key={entry.key} className="rounded-sm border border-rule bg-white px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[0.8125rem] font-medium text-graphite">{entry.name}</span>
                  <span className="shrink-0 font-mono text-micro text-faint">
                    {entry.status === "error" ? "failed" : entry.status === "done" ? "done" : `${Math.round(entry.progress)}%`}
                  </span>
                </div>
                {entry.status === "uploading" ? (
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-black/[0.06]">
                    <div
                      className="h-full bg-accent transition-[width]"
                      style={{ width: `${entry.progress}%` }}
                    />
                  </div>
                ) : null}
                {entry.error ? <p className="mt-1 text-[0.8125rem] text-muted">{entry.error}</p> : null}
              </li>
            ))}
          </ul>
          {allSettled ? (
            <button
              type="button"
              onClick={() => setUploads([])}
              className="mt-2 text-[0.8125rem] font-medium text-muted underline decoration-rule-strong underline-offset-4 hover:text-graphite"
            >
              Clear
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6">
        <label htmlFor="media-search" className="sr-only">
          Search media by file name
        </label>
        <input
          id="media-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            // A type="search" input triggers a form's implicit submission on
            // Enter — a default action of the keypress, not a bubbling event,
            // so only preventDefault() (not stopPropagation()) stops it. This
            // component renders no <form> of its own, so when it's embedded
            // as a picker inside another page's form (MediaPicker), an Enter
            // here would otherwise submit that host form.
            if (event.key === "Enter") event.preventDefault();
          }}
          placeholder="Search by file name…"
          className={field}
        />
      </div>

      <div className="mt-4">
        {filtered.length === 0 ? (
          <Empty>{query ? "No images match your search." : "No images yet. Drag some in above."}</Empty>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((item) => {
              const isStatic = item.source === "static";
              return (
                <div key={item.url} className="overflow-hidden rounded-sm border border-rule bg-white">
                  <button
                    type="button"
                    onClick={() => (onSelect ? onSelect(item.url) : void handleCopy(item.url))}
                    className="block w-full text-left"
                  >
                    <div className="aspect-square w-full overflow-hidden bg-black/[0.04]">
                      {/* eslint-disable-next-line @next/next/no-img-element -- next/image would proxy this through next.config's Vercel Blob wildcard; a plain <img> keeps that surface no wider than it needs to be. These thumbnails are chrome, not content, hence the empty alt. */}
                      <img src={item.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                    </div>
                    <div className="px-3 py-2">
                      <p className="truncate text-[0.8125rem] font-medium text-graphite">{item.name}</p>
                      <p className="mt-0.5 font-mono text-micro text-faint">
                        {humanSize(item.bytes)}
                        {isStatic ? " · repository" : ""}
                      </p>
                    </div>
                  </button>

                  {manageMode ? (
                    isStatic ? (
                      <div className="flex items-center justify-between gap-2 border-t border-rule px-3 py-2">
                        <span className="text-[0.75rem] text-faint">Repository</span>
                        <button
                          type="button"
                          disabled
                          title="Committed to the repository — delete the file and re-run npm run media:manifest"
                          className="text-[0.75rem] font-medium text-faint disabled:cursor-not-allowed"
                        >
                          Delete
                        </button>
                      </div>
                    ) : (
                      <MediaDeleteControl url={item.url} copied={copiedUrl === item.url} />
                    )
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * One uploaded item's Delete affordance: a single click must never delete —
 * an image removed here breaks a live post's cover or `og:image`, or a
 * published work's image, with no way to get it back. Modelled directly on
 * `InquiryControls`' two-step delete (`src/components/admin/inquiry-controls.tsx`):
 * first click shows a confirmation with "Yes, delete" and "Cancel"; only
 * "Yes, delete" calls the server action.
 *
 * State lives here, one instance per grid item, rather than as
 * `deletingUrl`/`isDeleting` shared across the whole grid — the previous
 * shape could desync (a stale disabled state, a confirmation meant for one
 * thumbnail applying to another) the moment more than one item was touched.
 * The server's in-use refusal (if any) renders inline, on this item alone.
 */
function MediaDeleteControl({ url, copied }: { url: string; copied: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (confirming) {
    return (
      <div className="border-t border-rule px-3 py-2">
        <p className="text-[0.75rem] text-graphite">
          Delete this image permanently? This cannot be undone.
        </p>
        {error ? (
          <p role="alert" className="mt-1.5 text-[0.75rem] text-muted">
            {error}
          </p>
        ) : null}
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setError(null);
              start(async () => {
                const result = await deleteMedia(url);
                if ("error" in result) {
                  setError(result.error);
                  return;
                }
                router.refresh();
              });
            }}
            className="rounded-sm bg-accent px-2.5 py-1 text-[0.75rem] font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Deleting…" : "Yes, delete"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setConfirming(false);
              setError(null);
            }}
            className="rounded-sm border border-rule-strong px-2.5 py-1 text-[0.75rem] font-medium disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 border-t border-rule px-3 py-2">
      <span className="text-[0.75rem] text-faint">{copied ? "Copied" : "Uploaded"}</span>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-[0.75rem] font-medium text-muted underline decoration-rule-strong underline-offset-4 hover:text-graphite"
      >
        Delete
      </button>
    </div>
  );
}
