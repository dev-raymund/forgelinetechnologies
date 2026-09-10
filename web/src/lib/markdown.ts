import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: false });

/**
 * Post bodies are authored only by the signed-in admin, so this is not a
 * sanitizer boundary — it is a renderer. If you ever open authoring to
 * untrusted users, run the output through a sanitizer here.
 */
export function renderMarkdown(md: string): string {
  return marked.parse(md ?? "", { async: false });
}

/** "2026-09-07" -> "September 7, 2026" */
export function formatDate(d: Date | string | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
