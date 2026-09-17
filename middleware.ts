import { type NextRequest, NextResponse } from "next/server";

/**
 * Page-level guard for the dashboard shell. Full session validation still
 * happens server-side in every API route via requireAuthUser(), this only
 * prevents unauthenticated users from receiving the dashboard HTML at all.
 * It cannot be fooled into authenticating anyone on its own.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionToken = request.cookies.get("access_token")?.value;
  const marker = request.cookies.get("logged_in")?.value;

  if (!sessionToken || marker !== "true") {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
