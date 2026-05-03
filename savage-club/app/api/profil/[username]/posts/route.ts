// app/api/profil/[username]/posts/route.ts
import { getServerSession, authOptions } from "@/lib/auth-compat";
import { prisma }       from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

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

  // Récupérer le profil
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

  // Filtres selon l'onglet
  const visibilityFilter = isOwner
    ? {}
    : isSubscriber
    ? { visibility: { in: ["PUBLIC", "SUBSCRIBERS"] as any } }
    : { visibility: "PUBLIC" as any };

  let where: any = {
    userId: profileUser.id,
    status: "PUBLISHED",
  };

  if (tab === "posts") {
    where = { ...where, ...visibilityFilter };
  } else if (tab === "reels") {
    where = {
      ...where,
      ...visibilityFilter,
      PostMedia: { some: { type: "VIDEO" } },
    };
  } else if (tab === "shop") {
    where = { ...where, price: { gt: 0 } };
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
    posts: items.map((p) => ({
      id:         p.id,
      content:    p.content ?? "",
      visibility: p.visibility,
      price:      p.price,
      previewUrl: p.previewUrl,
      medias:     p.PostMedia,
      likes:      p.Like,
      comments:   p.Comment,
    })),
    nextCursor,
    hasMore,
  });
}
