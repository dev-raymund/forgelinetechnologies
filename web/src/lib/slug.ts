export function slugify(input: string): string {
  // NFKD splits accented chars into base + combining mark; the [^a-z0-9] strip
  // below then drops the marks, so "Café Co" -> "cafe-co".
  return input
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 190);
}

/** Appends -2, -3 … until the slug is free. `taken` is the existing set. */
export function uniqueSlug(base: string, taken: Set<string>): string {
  const root = base || "untitled";
  if (!taken.has(root)) return root;
  let n = 2;
  while (taken.has(`${root}-${n}`)) n++;
  return `${root}-${n}`;
}
