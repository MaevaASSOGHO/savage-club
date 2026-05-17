// app/api/posts/feed/route.ts
import { getServerSession, authOptions } from "@/lib/auth-compat";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const LIMIT = 20;

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(req.url);

  const cursor = searchParams.get("cursor");
  const type   = searchParams.get("type") ?? "home"; // home | creators | formateurs

  let currentUser: { id: string } | null = null;
  if (session?.user?.email) {
    currentUser = await prisma.user.findUnique({
      where:  { email: session.user.email },
      select: { id: true },
    });
  }

  let subscribedCreatorIds: string[] = [];
  if (currentUser) {
    const subs = await prisma.subscription.findMany({
      where:  { subscriberId: currentUser.id, status: "ACTIVE" },
      select: { creatorId: true },
    });
    subscribedCreatorIds = subs.map((s) => s.creatorId);
  }

  // Filtre selon le type de feed
  const roleFilter =
    type === "creators"   ? { role: "CREATOR"  as const } :
    type === "formateurs" ? { role: "TRAINER"  as const } :
    undefined;

  const posts = await prisma.post.findMany({
    where: {
      status: "PUBLISHED",
      ...(roleFilter ? { User: roleFilter } : {}),
      OR: [
        { visibility: "PUBLIC" },
        { visibility: "SUBSCRIBERS", userId: { in: subscribedCreatorIds } },
      ],
    },
    include: {
      User: {
        select: {
          id: true, username: true, displayName: true,
          avatar: true, isVerified: true,
          subscriptionPrice: true, subscriptionVIP: true,
        },
      },
      PostMedia: { orderBy: { order: "asc" } },
      Like:      true,
      Comment: {
        where:   { parentId: null },
        include: { User: { select: { id: true, username: true, avatar: true } } },
        orderBy: { createdAt: "asc" },
        take:    2,
      },
      _count: { select: { Comment: true } },
    },
    orderBy: { createdAt: "desc" },
    take:    LIMIT + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore    = posts.length > LIMIT;
  const items      = hasMore ? posts.slice(0, LIMIT) : posts;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  const postIds    = items.map((p) => p.id);
  const creatorIds = [...new Set(items.map((p) => p.User.id))];

  // Données personnalisées en parallèle
  const [reactions, savedPosts, subscriptions] = currentUser
    ? await Promise.all([
        prisma.reaction.findMany({
          where:  { userId: currentUser.id, postId: { in: postIds } },
          select: { postId: true, type: true },
        }),
        prisma.savedPost.findMany({
          where:  { userId: currentUser.id, postId: { in: postIds } },
          select: { postId: true, collectionId: true },
        }),
        prisma.subscription.findMany({
          where:  { subscriberId: currentUser.id, creatorId: { in: creatorIds }, status: "ACTIVE" },
          select: { creatorId: true, tier: true },
        }),
      ])
    : [[], [], []];

  const reactionsByPost = new Map<string, { liked: boolean; sparked: boolean; idea: boolean }>();
  for (const r of reactions as { postId: string; type: string }[]) {
    const cur = reactionsByPost.get(r.postId) ?? { liked: false, sparked: false, idea: false };
    if (r.type === "LIKE")    cur.liked   = true;
    if (r.type === "SPARKLE") cur.sparked = true;
    if (r.type === "IDEA")    cur.idea    = true;
    reactionsByPost.set(r.postId, cur);
  }

  const savedByPost = new Map<string, string | null>();
  for (const s of savedPosts as { postId: string; collectionId: string | null }[]) {
    savedByPost.set(s.postId, s.collectionId);
  }

  const tierByCreator = new Map<string, string>();
  for (const s of subscriptions as { creatorId: string; tier: string }[]) {
    tierByCreator.set(s.creatorId, s.tier);
  }

  const result = items.map((post) => {
    const r       = reactionsByPost.get(post.id);
    const isSaved = savedByPost.has(post.id);
    const tier    = tierByCreator.get(post.User.id);

    return {
      post: {
        id:        post.id,
        content:   post.content ?? "",
        createdAt: post.createdAt.toISOString(),
        price:     post.price,
        previewUrl: post.previewUrl,
        medias:    post.PostMedia,
        likes:     post.Like,
        comments:  post.Comment,
        user:      post.User,
      },
      initialData: {
        saved:            isSaved,
        collectionId:     isSaved ? savedByPost.get(post.id) : null,
        fired:            r?.liked   ?? false,
        sparked:          r?.sparked ?? false,
        idea:             r?.idea    ?? false,
        likeCount:        post.Like.length,
        subscriptionTier: (tier ?? "NONE") as "NONE" | "FREE" | "SAVAGE" | "VIP",
      },
    };
  });

  return NextResponse.json({ items: result, nextCursor, hasMore });
}