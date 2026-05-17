// app/createurs/page.tsx
import { getServerSession, authOptions } from "@/lib/auth-compat";
import { prisma } from "@/lib/prisma";
import FeedLayout from "@/components/FeedLayout";
import FeedInfiniteScroll from "@/components/FeedInfiniteScroll";

export const dynamic = "force-dynamic";

const LIMIT = 20;

export default async function CreatorsPage() {
  const session = await getServerSession(authOptions);

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

  const posts = await prisma.post.findMany({
    where: {
      status: "PUBLISHED",
      User:   { role: "CREATOR" },
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
  });

  const hasMore    = posts.length > LIMIT;
  const items      = hasMore ? posts.slice(0, LIMIT) : posts;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  const postIds    = items.map((p) => p.id);
  const creatorIds = [...new Set(items.map((p) => p.User.id))];

  const [collections, reactions, savedPosts, subscriptions] = currentUser
    ? await Promise.all([
        prisma.collection.findMany({
          where:  { userId: currentUser.id },
          select: { id: true, name: true },
          orderBy: { createdAt: "desc" },
        }),
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
    : [[], [], [], []];

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

  const initialItems = items.map((post) => {
    const r       = reactionsByPost.get(post.id);
    const isSaved = savedByPost.has(post.id);
    const tier    = tierByCreator.get(post.User.id);

    return {
      post: {
        id:         post.id,
        content:    post.content ?? "",
        createdAt:  post.createdAt.toISOString(),
        price:      post.price,
        previewUrl: post.previewUrl,
        medias:     post.PostMedia,
        likes:      post.Like,
        comments:   post.Comment,
        user:       post.User,
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

  return (
    <FeedLayout variant="solid">
      {initialItems.length === 0 ? (
        <p className="text-white/40 text-center text-sm">Aucun contenu pour le moment.</p>
      ) : (
        <FeedInfiniteScroll
          initialItems={initialItems}
          initialCursor={nextCursor}
          initialHasMore={hasMore}
          feedType="creators"
          collections={collections as { id: string; name: string }[]}
        />
      )}
    </FeedLayout>
  );
}