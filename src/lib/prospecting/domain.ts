/**
 * Domain normalization for prospect deduplication.
 *
 * Purely syntactic and deliberately so: a 2,000-row import would otherwise mean
 * 2,000 DNS lookups, and the SSRF guarantee already lives where it belongs — in
 * `assertSafeUrl` inside `fetchBoundedPage`, which runs on every fetch and every
 * redirect. A domain that resolves somewhere private is caught at audit time.
 */

/** The deduplication key: lowercase host, no scheme, no `www.`, no port, no path. */
export function normalizeDomain(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed);
  let url: URL;
  try {
    url = new URL(hasScheme ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  // Credentials in a prospect URL are always a mistake or an attack.
  if (url.username || url.password) return null;

  let host = url.hostname.toLowerCase();
  if (host.endsWith(".")) host = host.slice(0, -1);
  if (host.startsWith("www.")) host = host.slice(4);

  if (host.length === 0 || host.length > 253) return null;
  // An IPv6 literal keeps its brackets in `hostname`.
  if (host.startsWith("[")) return null;
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) return null;
  // A business site always has a dot; this also rejects "localhost".
  if (!host.includes(".")) return null;
  if (!/^[a-z0-9.-]+$/.test(host)) return null;

  return host;
}

/**
 * The URL handed to the audit engine. Built from the normalized domain rather
 * than the source's original string so a tracking query or a stale deep link
 * never becomes the audited page; the engine follows redirects from here.
 */
export function websiteUrlForDomain(domain: string): string {
  return `https://${domain}/`;
}
