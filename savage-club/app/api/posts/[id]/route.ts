import { getServerSession, authOptions } from "@/lib/auth-compat";
// app/api/posts/[id]/route.ts
import { prisma } from "@/lib/prisma";


import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      User: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          isVerified: true,
          role: true,
        },
      },
      PostMedia: { orderBy: { order: "asc" } },
      Like: { select: { id: true, userId: true } },
      Comment: {
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
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!post) return NextResponse.json({ error: "Post introuvable" }, { status: 404 });

  // Viewer info
  let viewerLiked = false;
  let viewerSaved = false;

  if (session?.user?.email) {
    const viewer = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (viewer) {
      viewerLiked = post.Like.some((l) => l.userId === viewer.id);
      const saved = await prisma.savedPost.findUnique({
        where: { userId_postId: { userId: viewer.id, postId: id } },
      });
      viewerSaved = !!saved;
    }
  }

  return NextResponse.json({ ...post, viewerLiked, viewerSaved });
}
