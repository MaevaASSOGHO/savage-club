// app/api/posts/[id]/comments/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const comments = await prisma.comment.findMany({
    where: { postId: id, parentId: null },
    include: {
      User: { select: { username: true, avatar: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Mapper PascalCase → camelCase
  const formatted = comments.map((c) => ({
    id:        c.id,
    text:      c.text,
    createdAt: c.createdAt,
    user:      c.User ?? null,
  }));

  return NextResponse.json(formatted);
}
