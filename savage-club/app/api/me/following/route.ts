import { getServerSession, authOptions } from "@/lib/auth-compat";
// app/api/me/following/route.ts
import { prisma } from "@/lib/prisma";


import { NextResponse } from "next/server";

// GET /api/me/following?role=CREATOR|TRAINER
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role"); // CREATOR | TRAINER | null = tous

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const follows = await prisma.follow.findMany({
    where: { followerId: user.id },
    include: {
      User_Follow_followingIdToUser: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          category: true,
          isVerified: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  let users = follows.map((f) => f.User_Follow_followingIdToUser);

  // Filtrer par rôle si spécifié
  if (role) {
    users = users.filter((u) => u.role === role);
  }

  return NextResponse.json(users);
}
