// app/api/posts/[id]/comments/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const comments = await prisma.comment.findMany({
    where: { postId: id, parentId: null }, // commentaires racine seulement
    include: {
      User: { select: { username: true, avatar: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(comments);
}
