/**
 * Next.js 16+ edge boundary: `src/proxy.ts` replaces `src/middleware.ts` (same runtime role).
 * Runs before matched routes; use `matcher` to skip static assets and `/api/*` (handlers call `auth()` themselves).
 * This layer only steers unauthenticated users away from `/dashboard` and `/journal`; do not rely on it alone for authorization.
 */
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const pathname = req.nextUrl.pathname;

  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/journal");

  if (isProtected && !isLoggedIn) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
