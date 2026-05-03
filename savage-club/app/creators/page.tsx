// app/createurs/page.tsx
import { getServerSession, authOptions } from "@/lib/auth-compat";
import { prisma }     from "@/lib/prisma";
import PostCard       from "@/components/PostCard";
import FeedLayout     from "@/components/FeedLayout";

export const dynamic = "force-dynamic";

export default async function CreatorsPage() {
  const session = await getServerSession(authOptions);

  let subscribedCreatorIds: string[] = [];

  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where:  { email: session.user.email },
      select: { id: true },
    });
    if (user) {
      const subs = await prisma.subscription.findMany({
        where:  { subscriberId: user.id, status: "ACTIVE" },
        select: { creatorId: true },
      });
      subscribedCreatorIds = subs.map((s) => s.creatorId);
    }
  }

  const postsFromDb = await prisma.post.findMany({
    where: {
      User:   { role: "CREATOR" },
      status: "PUBLISHED",
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
        },
      },
      Like: true, Comment: true, PostMedia: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const posts = postsFromDb
    .filter((p) => p.User !== null)
    .map((p) => ({
      ...p,
      content:  p.content ?? "",
      user:     p.User,
      medias:   p.PostMedia,
      likes:    p.Like,
      comments: p.Comment,
    }));

  return (
    <FeedLayout variant="solid">
      {posts.length === 0 ? (
        <p className="text-white/40 text-center text-sm">Aucun contenu pour le moment.</p>
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post}/>)
      )}
    </FeedLayout>
  );
}
