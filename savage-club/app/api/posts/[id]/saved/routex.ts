// app/api/posts/[id]/saved/route.ts
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ saved: false });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) return NextResponse.json({ saved: false });

  const saved = await prisma.savedPost.findUnique({
    where: {
      userId_postId: {
        userId: user.id,
        postId: id,
      },
    },
  });

  return NextResponse.json({ saved: !!saved });
}
