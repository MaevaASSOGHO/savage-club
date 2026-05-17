// app/api/profil/[username]/posts/route.ts
import { getServerSession, authOptions } from "@/lib/auth-compat";
import { prisma }                        from "@/lib/prisma";
import { NextRequest, NextResponse }     from "next/server";
import { getCached, setCached }          from "@/lib/cache";

const LIMIT = 12;

type ProfileUser = { id: string; email: string };
type SubStatus   = { isSubscriber: boolean; purchasedPostIds: string[] };

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const { searchParams } = new URL(req.url);
  const tab    = searchParams.get("tab")    ?? "posts";
  const cursor = searchParams.get("cursor") ?? undefined;

  const session = await getServerSession(authOptions);

  // ── Cache du profil utilisateur ──────────────────────────────────────────
  const profileCacheKey = `user:profil:${username}`;
  let profileUser = await getCached<ProfileUser>(profileCacheKey);

  if (!profileUser) {
    const found = await prisma.user.findUnique({
      where:  { username },
      select: { id: true, email: true },
    });
    if (!found) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    profileUser = found;
    await setCached(profileCacheKey, profileUser, "user");
  }

  const isOwner = session?.user?.email === profileUser.email;

  // ── Cache de l'abonnement viewer → créateur ──────────────────────────────
  let isSubscriber     = false;
  let purchasedPostIds: string[] = [];

  if (session?.user?.email && !isOwner) {
    const viewer = await prisma.user.findUnique({
      where:  { email: session.user.email },
      select: { id: true },
    });

    if (viewer) {
      const subCacheKey = `sub:${viewer.id}:${profileUser.id}`;
      let subStatus = await getCached<SubStatus>(subCacheKey);

      if (!subStatus) {
        const [sub, purchases] = await Promise.all([
          prisma.subscription.findFirst({
            where:  { subscriberId: viewer.id, creatorId: profileUser.id, status: "ACTIVE" },
            select: { tier: true },
          }),
          prisma.postPurchase.findMany({
            where:  { userId: viewer.id },
            select: { postId: true },
          }),
        ]);

        subStatus = {
          isSubscriber:    !!sub && (sub.tier === "SAVAGE" || sub.tier === "VIP"),
          purchasedPostIds: purchases.map((p) => p.postId),
        };

        await setCached(subCacheKey, subStatus, "subscription");
      }

      isSubscriber     = subStatus.isSubscriber;
      purchasedPostIds = subStatus.purchasedPostIds;
    }
  }

  // ── Requête posts ────────────────────────────────────────────────────────
  const where: Record<string, unknown> = {
    userId: profileUser.id,
    status: "PUBLISHED",
  };

  if (tab === "reels") where.PostMedia = { some: { type: "VIDEO" } };
  if (tab === "shop")  where.price     = { gt: 0 };

  const posts = await prisma.post.findMany({
    where,
    include: {
      Like:      { select: { id: true } },
      Comment:   { select: { id: true } },
      PostMedia: { orderBy: { order: "asc" } },
    },
    orderBy: { createdAt: "desc" },
    take:    LIMIT + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore    = posts.length > LIMIT;
  const items      = hasMore ? posts.slice(0, LIMIT) : posts;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({
    posts: items.map((p) => {
      const isPurchased = purchasedPostIds.includes(p.id);
      const isLocked    = !isOwner && p.visibility === "SUBSCRIBERS" && !isSubscriber && !isPurchased;

      return {
        id:         p.id,
        content:    p.content ?? "",
        visibility: p.visibility,
        price:      isPurchased ? null : p.price,
        previewUrl: p.previewUrl,
        medias:     p.PostMedia,
        likes:      p.Like,
        comments:   p.Comment,
        locked:     isLocked,
      };
    }),
    nextCursor,
    hasMore,
  });
}