// app/api/profil/[username]/posts/route.ts
import { getServerSession, authOptions } from "@/lib/auth-compat";
import { prisma }                        from "@/lib/prisma";
import { NextRequest, NextResponse }     from "next/server";

const LIMIT = 12;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const { searchParams } = new URL(req.url);
  const tab    = searchParams.get("tab") ?? "posts";
  const cursor = searchParams.get("cursor") ?? undefined;

  const session = await getServerSession(authOptions);

  const profileUser = await prisma.user.findUnique({
    where:  { username },
    select: { id: true, email: true },
  });
  if (!profileUser) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const isOwner = session?.user?.email === profileUser.email;

  let isSubscriber    = false;
  let purchasedPostIds: string[] = [];

  if (session?.user?.email && !isOwner) {
    const viewer = await prisma.user.findUnique({
      where:  { email: session.user.email },
      select: { id: true },
    });
    if (viewer) {
      // Abonnement actif
      const sub = await prisma.subscription.findFirst({
        where:  { subscriberId: viewer.id, creatorId: profileUser.id, status: "ACTIVE" },
        select: { tier: true },
      });
      isSubscriber = !!sub && (sub.tier === "SAVAGE" || sub.tier === "VIP");

      // Posts déjà achetés
      const purchases = await prisma.postPurchase.findMany({
        where:  { userId: viewer.id },
        select: { postId: true },
      });
      purchasedPostIds = purchases.map((p) => p.postId);
    }
  }

  let where: any = {
    userId: profileUser.id,
    status: "PUBLISHED",
  };

  if (tab === "reels") {
    where.PostMedia = { some: { type: "VIDEO" } };
  } else if (tab === "shop") {
    where.price = { gt: 0 };
  }

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
        // Si déjà acheté → price = null pour ne plus afficher l'overlay payant
        price:      isPurchased ? null : p.price,
        previewUrl: p.previewUrl,
        // Toujours exposer les URLs — le CSS gère le flou
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
