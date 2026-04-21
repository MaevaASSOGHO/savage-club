// app/api/users/[username]/followers/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(
  req: Request,
  context: { params: Promise<{ username: string }> }
) {
  const { username } = await context.params;

  if (!username) {
    return NextResponse.json({ error: "username manquant" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);

  const profile = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (!profile) {
    return NextResponse.json({ error: "User introuvable" }, { status: 404 });
  }

  let viewerId: string | null = null;

  if (session?.user?.email) {
    const viewer = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    viewerId = viewer?.id || null;
  }

  const follows = await prisma.follow.findMany({
    where: { followingId: profile.id },
    include: {
      User_Follow_followerIdToUser: {
        select: {
          id: true,
          username: true,
          avatar: true,
          isVerified: true,
        },
      },
    },
  });

  let viewerFollows: string[] = [];

  if (viewerId) {
  const vf = await prisma.follow.findMany({
    where: { followerId: viewerId }, // moi
    select: { followingId: true },   // qui je suis
    });

    viewerFollows = vf.map((f) => f.followingId);
  }

  const users = follows.map((f) => ({
        ...f.User_Follow_followerIdToUser,
        isFollowing: viewerFollows.includes(f.User_Follow_followerIdToUser.id),
    }));

  // déduplication propre
  const uniqueUsers = Array.from(
    new Map(users.map((u) => [u.id, u])).values()
  );

  return NextResponse.json(uniqueUsers);
}