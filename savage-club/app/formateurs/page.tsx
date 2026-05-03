// app/formateurs/page.tsx
import { prisma }    from "@/lib/prisma";
import PostCard      from "@/components/PostCard";
import FeedLayout    from "@/components/FeedLayout";

export const dynamic = "force-dynamic";

export default async function FormateursPage() {
  const postsFromDb = await prisma.post.findMany({
    where: {
      User:   { role: "TRAINER" },
      status: "PUBLISHED",
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
