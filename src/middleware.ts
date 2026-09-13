import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/cookie";

/**
 * A cheap filter, not the security boundary.
 *
 * Middleware runs on the edge: it cannot reach the database, so it cannot tell
 * whether a session is valid, whether it has expired, or what role it carries.
 * All it does is bounce browsers with no cookie at all, so an unauthenticated
 * visitor gets the login screen instead of a flash of the dashboard.
 *
 * Every page, server action and route handler under /admin does the real check
 * with requireUser/requireCapability, which resolve the session against the
 * database. Forging this cookie gets you a redirect to /admin/login and
 * nothing else.
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // The login screen has to stay reachable without a session, or an
  // unauthenticated visitor is redirected to it forever.
  if (pathname === "/admin/login") return NextResponse.next();

  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*"],
};
