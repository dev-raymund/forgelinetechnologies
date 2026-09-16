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
  const [copyError, setCopyError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();
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
          setEntry(key, {
            status: "error",
            error: error instanceof Error ? error.message : `${file.name} could not be uploaded.`,
          });
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

  const handleCopy = useCallback(async (url: string) => {
    setCopyError(null);
    // navigator.clipboard is undefined outside a secure context (plain HTTP,
    // some embedded webviews), and writeText can reject even when it exists
    // (no permission, no focus). Both paths must degrade to a message, not a
    // thrown error.
    if (!navigator.clipboard) {
      setCopyError("Copying is not available here. Copy the URL from the address bar instead.");
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      window.setTimeout(() => setCopiedUrl((prev) => (prev === url ? null : prev)), 2000);
    } catch {
      setCopyError("Could not copy that URL. Copy it manually instead.");
    }
  }, []);

  const handleDelete = useCallback(
    (url: string) => {
      setDeleteError(null);
      setDeletingUrl(url);
      startDelete(async () => {
        const result = await deleteMedia(url);
        if ("error" in result) {
          setDeleteError(result.error);
          setDeletingUrl(null);
          return;
        }
        setDeletingUrl(null);
        router.refresh();
      });
    },
    [router],
  );

  const allSettled = uploads.length > 0 && uploads.every((u) => u.status !== "uploading");

  return (
    <div>
      {blobError ? (
        <p role="alert" className="mb-5 border-l-2 border-accent bg-white px-4 py-3 text-[0.9375rem]">
          {blobError}
        </p>
      ) : null}

      {deleteError ? (
        <p role="alert" className="mb-5 border-l-2 border-accent bg-white px-4 py-3 text-[0.9375rem]">
          {deleteError}
        </p>
      ) : null}

      {copyError ? (
        <p role="alert" className="mb-5 border-l-2 border-accent bg-white px-4 py-3 text-[0.9375rem]">
          {copyError}
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
                    <div className="flex items-center justify-between gap-2 border-t border-rule px-3 py-2">
                      <span className="text-[0.75rem] text-faint">
                        {copiedUrl === item.url ? "Copied" : isStatic ? "Repository" : "Uploaded"}
                      </span>
                      {isStatic ? (
                        <button
                          type="button"
                          disabled
                          title="Committed to the repository — delete the file and re-run npm run media:manifest"
                          className="text-[0.75rem] font-medium text-faint disabled:cursor-not-allowed"
                        >
                          Delete
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isDeleting && deletingUrl === item.url}
                          onClick={() => handleDelete(item.url)}
                          className="text-[0.75rem] font-medium text-muted underline decoration-rule-strong underline-offset-4 hover:text-graphite disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isDeleting && deletingUrl === item.url ? "Deleting…" : "Delete"}
                        </button>
                      )}
                    </div>
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
