// middleware.ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req: NextRequest & { auth?: any }) => {
  const isLoggedIn = !!req.auth;
  const pathname   = req.nextUrl.pathname;

  const isAuthPage = pathname === "/auth" || pathname === "/register" || pathname.startsWith("/auth/");
  const isPublic   =
    pathname.startsWith("/api")       ||
    pathname.startsWith("/_next")     ||
    pathname.startsWith("/cgu")       ||
    pathname.startsWith("/onboarding");

  // Pas connecté → /auth
  if (!isLoggedIn && !isAuthPage && !isPublic) {
    return NextResponse.redirect(new URL("/auth", req.url));
  }

  // Déjà connecté + sur page auth → /
  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Onboarding incomplet → /onboarding
  if (isLoggedIn && !isPublic && !isAuthPage) {
    // req.auth est la SESSION (pas le token JWT brut)
    // les champs custom sont sous req.auth.user.*
    const user           = req.auth?.user as any;
    const role           = user?.role           ?? "USER";
    const onboardingStep = Number(user?.onboardingStep ?? 0);
    const maxStep        = role === "USER" ? 2 : 5;

    if (onboardingStep < maxStep) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};