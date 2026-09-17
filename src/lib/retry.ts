/**
 * Retries for Neon cold starts.
 *
 * This lives in its own import-free module so the plain-Node CLIs can use it.
 * `src/lib/queries.ts` is `server-only`, which only Next.js can import, and a
 * CLI that imports it fails before it runs.
 *
 * Neon's serverless tier suspends after inactivity, and the first query
 * against a cold instance can exceed the driver's connect timeout. Those
 * failures are transient, so retry them briefly.
 *
 * Only connection-level failures retry. A genuine SQL error throws
 * immediately, because retrying bad SQL just delays the same failure.
 */
const TRANSIENT =
  /fetch failed|ConnectTimeout|UND_ERR_CONNECT_TIMEOUT|ECONNRESET|ETIMEDOUT|socket hang up|terminated/i;

export function isTransient(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const cause = (err as { cause?: unknown }).cause;
  const source = (err as { sourceError?: unknown }).sourceError;
  return TRANSIENT.test(
    [err.message, err.name, String(cause ?? ""), String(source ?? "")].join(" "),
  );
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
  wait: (ms: number) => Promise<void> = sleep,
): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      last = err;
      if (!isTransient(err) || i === attempts - 1) throw err;
      // 300ms, then 600ms — enough for a suspended instance to wake.
      await wait(300 * 2 ** i);
    }
  }
  throw last;
}

/**
 * One line an operator can act on. Neon wraps the real cause, usually a
 * connect timeout, inside a generic "fetch failed", so the cause is named
 * alongside the message rather than left in a stack trace.
 */
export function describeError(error: unknown): string {
  if (!(error instanceof Error)) return String(error).replace(/\s+/g, " ").trim();
  const { cause, sourceError } = error as { cause?: unknown; sourceError?: unknown };
  const inner = cause ?? sourceError;
  const innerText =
    inner instanceof Error ? inner.message : inner === undefined || inner === null ? "" : String(inner);
  const text =
    innerText && !error.message.includes(innerText)
      ? `${error.message} (cause: ${innerText})`
      : error.message;
  return text.replace(/\s+/g, " ").trim();
}
