import { issueSignedToken } from "@vercel/blob";
import { handleUploadPresigned, type HandleUploadPresignedBody } from "@vercel/blob/client";
import { authorise } from "@/lib/auth/guard";
import { audit } from "@/lib/auth/audit";
import {
  ALLOWED_UPLOAD_TYPES,
  MAX_UPLOAD_BYTES,
  isSafeBlobPathname,
} from "@/lib/media/paths";

/**
 * Presigned uploads, authenticated with OIDC rather than a read-write token.
 *
 * WHY OIDC. The project's Blob store is connected through OIDC, so on Vercel the
 * SDK resolves credentials as VERCEL_OIDC_TOKEN + BLOB_STORE_ID before it ever
 * looks at BLOB_READ_WRITE_TOKEN (resolveBlobAuth in @vercel/blob). Listing and
 * deleting already work that way. The previous `handleUpload` could not: it signs
 * client tokens with BLOB_READ_WRITE_TOKEN only, with no OIDC fallback, so a stale
 * token left over from an earlier private store sent every upload to the wrong
 * store while the library listed the right one. `issueSignedToken` goes through
 * the same OIDC-first resolver as `list` and `del`, so all three now agree.
 *
 * ONE ROUTE, TWO CALLERS — which is why authorisation lives inside
 * `getSignedToken` and NOT at the top of this function.
 *
 * 1. The signed-in admin's browser asks for a presigned upload URL. That request
 *    carries a session cookie; `getSignedToken` authorises it and re-checks the
 *    pathname, type and size rather than trusting the client.
 * 2. Vercel Blob itself calls back when the upload finishes, to run
 *    `onUploadCompleted`. That request comes from Vercel's servers with no session
 *    cookie. `handleUploadPresigned` verifies its Ed25519 signature against
 *    BLOB_WEBHOOK_PUBLIC_KEY before `onUploadCompleted` runs.
 *
 * A session check at the top of the route would return 403 to caller 2, so every
 * upload would succeed while the audit entry was silently never written.
 *
 * Note that `handleUploadPresigned` throws "Missing webhook public key" for EVERY
 * request when BLOB_WEBHOOK_PUBLIC_KEY is unset. Production has it. A local dev
 * server needs it too, together with BLOB_STORE_ID and a VERCEL_OIDC_TOKEN, all of
 * which `vercel env pull` provides. Vercel cannot reach localhost, so the
 * upload-completed audit entry only appears on a deployed environment.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as HandleUploadPresignedBody;
    const result = await handleUploadPresigned({
      body,
      request,
      getSignedToken: async (pathname) => {
        const authorised = await authorise("media.manage");
        if (!authorised.ok) {
          throw new Error("Not authorised to upload media.");
        }
        if (!isSafeBlobPathname(pathname)) {
          throw new Error("That file name is not allowed.");
        }

        // The limits are set twice on purpose. On the delegation token they are
        // enforced by Blob's control plane, which signed it; on the presigned URL
        // they are enforced when the bytes arrive. Either alone would do; both
        // mean a mistake in one is not a hole.
        const token = await issueSignedToken({
          pathname,
          operations: ["put"],
          allowedContentTypes: [...ALLOWED_UPLOAD_TYPES],
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
        });

        return {
          token,
          urlOptions: {
            allowedContentTypes: [...ALLOWED_UPLOAD_TYPES],
            maximumSizeInBytes: MAX_UPLOAD_BYTES,
            addRandomSuffix: false,
            allowOverwrite: false,
            tokenPayload: JSON.stringify({
              userId: authorised.user.id,
              email: authorised.user.email,
            }),
          },
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
