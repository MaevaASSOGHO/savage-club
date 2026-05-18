import { getServerSession, authOptions } from "@/lib/auth-compat";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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
    select: { id: true, email: true },
  });

  if (!profile) {
    return NextResponse.json({ error: "User introuvable" }, { status: 404 });
  }

  const viewer = session?.user?.email
    ? await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, role: true },
      })
    : null;

  const isOwner = session?.user?.email === profile.email;
  const isAdmin = viewer?.role === "ADMIN";

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
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

  if (viewer) {
    const vf = await prisma.follow.findMany({
      where: { followerId: viewer.id },
      select: { followingId: true },
    });
    viewerFollows = vf.map((f) => f.followingId);
  }

  const users = follows.map((f) => ({
    ...f.User_Follow_followerIdToUser,
    isFollowing: viewerFollows.includes(f.User_Follow_followerIdToUser.id),
  }));

  const uniqueUsers = Array.from(
    new Map(users.map((u) => [u.id, u])).values()
  );

  return NextResponse.json(uniqueUsers);
}