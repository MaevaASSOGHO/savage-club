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

  // Niveau d'abonnement du visiteur
  let isSubscriber = false;
  if (session?.user?.email && !isOwner) {
    const viewer = await prisma.user.findUnique({
      where:  { email: session.user.email },
      select: { id: true },
    });
    if (viewer) {
      const sub = await prisma.subscription.findFirst({
        where:  { subscriberId: viewer.id, creatorId: profileUser.id, status: "ACTIVE" },
        select: { tier: true },
      });
      isSubscriber = !!sub && (sub.tier === "SAVAGE" || sub.tier === "VIP");
    }
  }

  // Filtrage des posts selon le paiement
  let purchasedPostIds: string[] = [];
  if (session?.user?.email && !isOwner) {
    const viewer = await prisma.user.findUnique({
      where:  { email: session.user.email },
      select: { id: true },
    });
    if (viewer) {
      const purchases = await prisma.postPurchase.findMany({
        where:  { userId: viewer.id },
        select: { postId: true },
      });
      purchasedPostIds = purchases.map((p) => p.postId);
    }
  }
  // Filtre selon l'onglet — pas de filtre visibility, on retourne tout
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
      // Masquer les URLs pour les posts abonnés si non abonné
      const isPurchased = purchasedPostIds.includes(p.id);
      const isLocked = !isOwner && p.visibility === "SUBSCRIBERS" && !isSubscriber;
      return {
        id:         p.id,
        content:    p.content ?? "",
        visibility: p.visibility,
        previewUrl: p.previewUrl,
        // Si verrouillé → pas d'URL réelle exposée
        medias:  p.PostMedia,
        likes:      p.Like,
        comments:   p.Comment,
        locked:     isLocked,
        price:   isPurchased ? null : p.price,
      };
    }),
    nextCursor,
    hasMore,
  });
}
