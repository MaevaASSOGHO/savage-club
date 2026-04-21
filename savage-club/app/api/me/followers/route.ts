// app/api/me/followers/route.ts

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const followers = await prisma.follow.findMany({
    where: { followingId: user.id },
    include: {
      User_Follow_followerIdToUser: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          isVerified: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const users = followers.map((f) => f.User_Follow_followerIdToUser);

  return NextResponse.json(users);
}