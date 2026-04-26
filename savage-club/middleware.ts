// middleware.ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";

import type { NextRequest } from "next/server";

export default auth((req: NextRequest & { auth?: any }) => {
  const isLoggedIn  = !!req.auth;
  const pathname    = req.nextUrl.pathname;
  
  const isAuthPage  = pathname === "/auth" || pathname === "/register" || pathname.startsWith("/auth/");;
  const isPublic    = pathname.startsWith("/api") || 
                      pathname.startsWith("/_next") ||
                      pathname.startsWith("/cgu");

  if (!isLoggedIn && !isAuthPage && !isPublic) {
    return NextResponse.redirect(new URL("/auth", req.url));
  }

  // Rediriger vers / si déjà connecté et sur page auth
  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)",],
};