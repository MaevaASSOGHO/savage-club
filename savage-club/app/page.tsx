// app/page.tsx
import { prisma } from "@/lib/prisma";
import PostCard from "@/components/PostCard";
import FeedLayout from "@/components/FeedLayout";

export default async function HomePage() {
  const posts = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    include: {
      User: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          isVerified: true,
        },
      },
      PostMedia: { orderBy: { order: "asc" } },
      Like: true,
      Comment: {
        where: { parentId: null },
        include: {
          User: {
            select: { id: true, username: true, avatar: true },
          },
        },
        orderBy: { createdAt: "asc" },
        take: 2,
      },
      _count: { select: { Comment: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <FeedLayout variant="solid">
      <div className="flex flex-col items-center w-full">
        {posts.map((post) => (
        <div key={post.id} className="w-full">
          <PostCard
            post={{
              id:       post.id,
              content:  post.content ?? "",
              medias:   post.PostMedia,
              likes:    post.Like,
              comments: post.Comment,
              user: {
                id:          post.User.id,
                username:    post.User.username,
                displayName: post.User.displayName,
                avatar:      post.User.avatar,
                isVerified:  post.User.isVerified,
              },
            }}
          />
        </div>
))}
      </div>
    </FeedLayout>
  );
}