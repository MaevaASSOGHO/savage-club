// app/page.tsx
import { getServerSession, authOptions } from "@/lib/auth-compat";
import { prisma } from "@/lib/prisma";
import PostCard from "@/components/PostCard";
import FeedLayout from "@/components/FeedLayout";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  // Récupérer l'utilisateur connecté une seule fois
  let currentUser: { id: string } | null = null;
  if (session?.user?.email) {
    currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
  }

  // IDs des créateurs auxquels l'utilisateur est abonné (pour filtrer les posts)
  let subscribedCreatorIds: string[] = [];
  if (currentUser) {
    const subs = await prisma.subscription.findMany({
      where: { subscriberId: currentUser.id, status: "ACTIVE" },
      select: { creatorId: true },
    });
    subscribedCreatorIds = subs.map((s) => s.creatorId);
  }

  const posts = await prisma.post.findMany({
    where: {
      status: "PUBLISHED",
      OR: [
        { visibility: "PUBLIC" },
        { visibility: "SUBSCRIBERS", userId: { in: subscribedCreatorIds } },
      ],
    },
    include: {
      User: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          isVerified: true,
          subscriptionPrice: true,
          subscriptionVIP: true,
        },
      },
      PostMedia: { orderBy: { order: "asc" } },
      Like: true,
      Comment: {
        where: { parentId: null },
        include: { User: { select: { id: true, username: true, avatar: true } } },
        orderBy: { createdAt: "asc" },
        take: 2,
      },
      _count: { select: { Comment: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const postIds = posts.map((p) => p.id);
  const creatorIds = [...new Set(posts.map((p) => p.User.id))];

  // Toutes les données personnalisées en une seule passe parallèle
  const [collections, reactions, savedPosts, subscriptions] = currentUser
    ? await Promise.all([
        prisma.collection.findMany({
          where: { userId: currentUser.id },
          select: { id: true, name: true },
          orderBy: { createdAt: "desc" },
        }),
        prisma.reaction.findMany({
          where: { userId: currentUser.id, postId: { in: postIds } },
          select: { postId: true, type: true },
        }),
        prisma.savedPost.findMany({
          where: { userId: currentUser.id, postId: { in: postIds } },
          select: { postId: true, collectionId: true },
        }),
        prisma.subscription.findMany({
          where: {
            subscriberId: currentUser.id,
            creatorId: { in: creatorIds },
            status: "ACTIVE",
          },
          select: { creatorId: true, tier: true },
        }),
      ])
    : [[], [], [], []];

  // Index pour accès O(1) par postId / creatorId
  const reactionsByPost = new Map<string, { liked: boolean; sparked: boolean; idea: boolean }>();
  for (const r of reactions as { postId: string; type: string }[]) {
    const current = reactionsByPost.get(r.postId) ?? { liked: false, sparked: false, idea: false };
    if (r.type === "LIKE")    current.liked   = true;
    if (r.type === "SPARKLE") current.sparked = true;
    if (r.type === "IDEA")    current.idea    = true;
    reactionsByPost.set(r.postId, current);
  }

  const savedByPost = new Map<string, string | null>();
  for (const s of savedPosts as { postId: string; collectionId: string | null }[]) {
    savedByPost.set(s.postId, s.collectionId);
  }

  const tierByCreator = new Map<string, string>();
  for (const s of subscriptions as { creatorId: string; tier: string }[]) {
    tierByCreator.set(s.creatorId, s.tier);
  }

  return (
    <FeedLayout variant="solid">
      <div className="flex flex-col items-center w-full max-w-2xl mx-auto px-4">
        {posts.map((post) => {
          const r = reactionsByPost.get(post.id);
          const isSaved = savedByPost.has(post.id);
          const tier = tierByCreator.get(post.User.id);

          return (
            <div key={post.id} className="w-full mb-4">
              <PostCard
                post={{
                  id: post.id,
                  content: post.content ?? "",
                  createdAt: post.createdAt.toISOString(),
                  price: post.price,
                  previewUrl: post.previewUrl,
                  medias: post.PostMedia,
                  likes: post.Like,
                  comments: post.Comment,
                  user: {
                    id: post.User.id,
                    username: post.User.username,
                    displayName: post.User.displayName,
                    avatar: post.User.avatar,
                    isVerified: post.User.isVerified,
                    subscriptionPrice: post.User.subscriptionPrice,
                    subscriptionVIP: post.User.subscriptionVIP,
                  },
                }}
                initialData={{
                  collections:       collections as { id: string; name: string }[],
                  saved:             isSaved,
                  collectionId:      isSaved ? savedByPost.get(post.id) : null,
                  fired:             r?.liked   ?? false,
                  sparked:           r?.sparked ?? false,
                  idea:              r?.idea    ?? false,
                  likeCount:         post.Like.length,
                  subscriptionTier:  (tier ?? "NONE") as "NONE" | "FREE" | "SAVAGE" | "VIP",
                }}
              />
            </div>
          );
        })}
      </div>
    </FeedLayout>
  );
}