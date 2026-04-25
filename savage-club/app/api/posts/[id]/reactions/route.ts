import { getServerSession, authOptions } from "@/lib/auth-compat";
// app/api/posts/[id]/reactions/route.ts
import { prisma } from "@/lib/prisma";

import { NextResponse } from "next/server";


export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ liked: false, sparked: false, idea: false, likeCount: 0 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ liked: false, sparked: false, idea: false, likeCount: 0 });
  }

  const [liked, sparked, idea, likeCount] = await Promise.all([
    prisma.like.findUnique({
      where: { userId_postId: { userId: user.id, postId: (await params).id } },
    }),
    prisma.reaction.findFirst({
      where: { userId: user.id, postId: (await params).id, type: "SPARKLE" },
    }),
    prisma.reaction.findFirst({
      where: { userId: user.id, postId: (await params).id, type: "IDEA" },
    }),
    prisma.like.count({ where: { postId: (await params).id } }),
  ]);

  return NextResponse.json({ liked: !!liked, sparked: !!sparked, idea: !!idea, likeCount });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const { type } = await req.json();
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  if (type === "LIKE") {
    const existing = await prisma.like.findUnique({
      where: { userId_postId: { userId: user.id, postId: (await params).id } },
    });
    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } });
      return NextResponse.json({ liked: false });
    }
    await prisma.like.create({ data: { id: crypto.randomUUID(), userId: user.id, postId: (await params).id } });
    return NextResponse.json({ liked: true });
  }

  // SPARKLE ou IDEA
  const existing = await prisma.reaction.findFirst({
    where: { userId: user.id, postId: (await params).id, type },
  });
  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
    return NextResponse.json({ active: false });
  }
  await prisma.reaction.create({ data: { id: crypto.randomUUID(), userId: user.id, postId: (await params).id, type } });
  return NextResponse.json({ active: true });
}
