// proxy.ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ── Upstash Redis ──────────────────────────────────────────────────────────
const redis = Redis.fromEnv();

// Limiteurs par catégorie de route
const limiters = {
  auth:          new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10,  "60 s"), prefix: "rl:auth" }),
  comments:      new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20,  "60 s"), prefix: "rl:comments" }),
  reactions:     new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30,  "60 s"), prefix: "rl:reactions" }),
  posts:         new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30,  "60 s"), prefix: "rl:posts" }),
  messages:      new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(40,  "60 s"), prefix: "rl:messages" }),
  notifications: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20,  "60 s"), prefix: "rl:notifications" }),
  default:       new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(100, "60 s"), prefix: "rl:default" }),
};

function getLimiter(pathname: string): Ratelimit {
  if (pathname.startsWith("/api/auth"))          return limiters.auth;
  if (pathname.startsWith("/api/comments"))      return limiters.comments;
  if (pathname.startsWith("/api/reactions"))     return limiters.reactions;
  if (pathname.startsWith("/api/posts"))         return limiters.posts;
  if (pathname.startsWith("/api/messages"))      return limiters.messages;
  if (pathname.startsWith("/api/notifications")) return limiters.notifications;
  return limiters.default;
}

// ── Proxy principal ────────────────────────────────────────────────────────
export default auth(async (req: NextRequest & { auth?: any }) => {
  const isLoggedIn = !!req.auth;
  const pathname   = req.nextUrl.pathname;

  // Rate limiting sur les routes API uniquement
  if (pathname.startsWith("/api/")) {
    const ip = (
      req.headers.get("x-forwarded-for")?.split(",")[0] ??
      req.headers.get("x-real-ip") ??
      "anonymous"
    ).trim();

    try {
      const limiter            = getLimiter(pathname);
      const { success, reset } = await limiter.limit(ip);

      if (!success) {
        const retryAfter = Math.ceil((reset - Date.now()) / 1000);
        return NextResponse.json(
          { error: "Trop de requêtes, réessaie dans quelques secondes." },
          {
            status: 429,
            headers: { "Retry-After": String(retryAfter) },
          }
        );
      }
    } catch {
      // Si Upstash est indisponible, on laisse passer plutôt que de bloquer
    }
  }

  // ── Auth & redirections ──────────────────────────────────────────────────
  const isAuthPage =
    pathname === "/auth" ||
    pathname === "/register" ||
    pathname.startsWith("/auth/");

  const isPublic =
    pathname.startsWith("/api/")       ||
    pathname.startsWith("/_next/")     ||
    pathname.startsWith("/cgu")        ||
    pathname.startsWith("/onboarding");

  if (!isLoggedIn && !isAuthPage && !isPublic) {
    return NextResponse.redirect(new URL("/auth", req.url));
  }

  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (isLoggedIn && !isPublic && !isAuthPage) {
    const user           = req.auth?.user as any;
    const role           = user?.role            ?? "USER";
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