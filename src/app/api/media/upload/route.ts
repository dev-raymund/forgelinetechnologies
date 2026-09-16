import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { authorise } from "@/lib/auth/guard";
import { audit } from "@/lib/auth/audit";
import {
  ALLOWED_UPLOAD_TYPES,
  MAX_UPLOAD_BYTES,
  isSafeBlobPathname,
} from "@/lib/media/paths";

/**
 * One route, two different callers — which is why authorisation lives inside
 * `onBeforeGenerateToken` and NOT at the top of this function.
 *
 * 1. The signed-in admin's browser asks for an upload token. That request
 *    carries a session cookie; `onBeforeGenerateToken` authorises it and
 *    re-checks the pathname, type and size rather than trusting the client.
 * 2. Vercel Blob itself calls back when the upload finishes, to run
 *    `onUploadCompleted`. That request comes from Vercel's servers and carries
 *    no session cookie at all. `handleUpload` authenticates it by verifying the
 *    webhook signature against `request`.
 *
 * A session check at the top of the route would return 403 to caller 2, so
 * every upload would succeed while `onUploadCompleted` silently never ran and
 * the audit entry was never written — with Vercel retrying five times.
 *
 * Vercel cannot reach localhost, so `onUploadCompleted` only fires on a deployed
 * environment. Uploads still work locally; the audit entry appears in production.
 */
export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const authorised = await authorise("media.manage");
        if (!authorised.ok) {
          throw new Error("Not authorised to upload media.");
        }
        if (!isSafeBlobPathname(pathname)) {
          throw new Error("That file name is not allowed.");
        }
        return {
          allowedContentTypes: [...ALLOWED_UPLOAD_TYPES],
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: false,
          tokenPayload: JSON.stringify({
            userId: authorised.user.id,
            email: authorised.user.email,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const actor = tokenPayload ? (JSON.parse(tokenPayload) as { userId: number; email: string }) : null;
        await audit({
          action: "media.upload",
          userId: actor?.userId ?? null,
          actorEmail: actor?.email ?? "",
          entity: "media",
          detail: blob.pathname.slice(0, 300),
        });
      },
    });
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 400 },
    );
  }
}
