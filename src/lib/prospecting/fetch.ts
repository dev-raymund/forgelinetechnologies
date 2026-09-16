import { assertSafeUrl, type HostResolver } from "./url-safety.ts";

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const DEFAULT_MAX_BYTES = 1_000_000;
const DEFAULT_MAX_REDIRECTS = 5;
const DEFAULT_TIMEOUT_MS = 10_000;

export type FetchOptions = {
  fetchImpl?: typeof fetch;
  resolveHost?: HostResolver;
  maxBytes?: number;
  maxRedirects?: number;
  timeoutMs?: number;
  allowedContentTypes?: readonly string[];
};

export type BoundedPageResponse = {
  requestedUrl: string;
  finalUrl: string;
  status: number;
  headers: Record<string, string>;
  contentType: string;
  body: string;
  bytes: number;
  elapsedMs: number;
  redirectChain: string[];
};

export class AuditFetchError extends Error {
  public readonly code: "redirect" | "size" | "timeout" | "content_type" | "body";

  constructor(
    message: string,
    code: "redirect" | "size" | "timeout" | "content_type" | "body",
  ) {
    super(message);
    this.name = "AuditFetchError";
    this.code = code;
  }
}

function headersRecord(headers: Headers): Record<string, string> {
  return Object.fromEntries(headers.entries());
}

async function readLimitedBody(response: Response, maxBytes: number): Promise<{ body: string; bytes: number }> {
  const declared = Number(response.headers.get("content-length") ?? "0");
  if (declared > maxBytes) {
    throw new AuditFetchError(`Response exceeds the ${maxBytes}-byte limit.`, "size");
  }
  if (!response.body) return { body: "", bytes: 0 };

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      bytes += next.value.byteLength;
      if (bytes > maxBytes) {
        throw new AuditFetchError(`Response exceeds the ${maxBytes}-byte limit.`, "size");
      }
      chunks.push(next.value);
    }
  } catch (error) {
    if (error instanceof AuditFetchError) throw error;
    throw new AuditFetchError("The response body could not be read.", "body");
  } finally {
    reader.releaseLock();
  }

  const combined = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { body: new TextDecoder().decode(combined), bytes };
}

export async function fetchBoundedPage(
  input: string | URL,
  options: FetchOptions = {},
): Promise<BoundedPageResponse> {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  if (!fetchImpl) throw new AuditFetchError("Fetch is not available.", "body");
  const resolveHost = options.resolveHost;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const allowedContentTypes = options.allowedContentTypes ?? ["text/html", "application/xhtml+xml"];
  const requested = new URL(String(input));
  await assertSafeUrl(requested, resolveHost);

  const started = Date.now();
  const redirectChain: string[] = [];
  let current = requested;

  for (;;) {
    await assertSafeUrl(current, resolveHost);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let response: Response;
    try {
      response = await fetchImpl(current, { redirect: "manual", signal: controller.signal });
    } catch (error) {
      if (controller.signal.aborted) {
        throw new AuditFetchError(`Fetch exceeded the ${timeoutMs}ms timeout.`, "timeout");
      }
      throw new AuditFetchError(
        error instanceof Error ? error.message : "The page could not be fetched.",
        "body",
      );
    } finally {
      clearTimeout(timeout);
    }

    if (REDIRECT_STATUSES.has(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new AuditFetchError("Redirect response has no location.", "redirect");
      if (redirectChain.length >= maxRedirects) {
        throw new AuditFetchError(`More than ${maxRedirects} redirects were followed.`, "redirect");
      }
      const next = new URL(location, current);
      await assertSafeUrl(next, resolveHost);
      redirectChain.push(next.toString());
      current = next;
      continue;
    }

    const contentType = response.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase() ?? "";
    if (contentType && !allowedContentTypes.includes(contentType)) {
      throw new AuditFetchError(`Unsupported content type: ${contentType}.`, "content_type");
    }
    const { body, bytes } = await readLimitedBody(response, maxBytes);
    return {
      requestedUrl: requested.toString(),
      finalUrl: current.toString(),
      status: response.status,
      headers: headersRecord(response.headers),
      contentType,
      body,
      bytes,
      elapsedMs: Math.max(0, Date.now() - started),
      redirectChain,
    };
  }
}
