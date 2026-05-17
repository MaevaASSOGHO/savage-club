// app/api/me/route.ts
import { getServerSession, authOptions } from "@/lib/auth-compat";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getCached, setCached, invalidateCache } from "@/lib/cache";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json(null, { status: 401 });
  }

  const cacheKey = `user:me:${session.user.email}`;

  // Tenter le cache d'abord
  const cached = await getCached<{
    id: string;
    username: string;
    avatar: string | null;
    role: string;
    isVerified: boolean;
  }>(cacheKey);

  if (cached) return NextResponse.json(cached);

  // Cache miss → DB
  const user = await prisma.user.findUnique({
    where:  { email: session.user.email },
    select: { id: true, username: true, avatar: true, role: true, isVerified: true },
  });

  if (user) await setCached(cacheKey, user, "user");

  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const body = await req.json();
  const { username, displayName, bio, category, location, website, avatar } = body;

  if (username) {
    const existing = await prisma.user.findFirst({
      where: { username, NOT: { email: session.user.email } },
    });
    if (existing) {
      return NextResponse.json({ error: "Ce nom d'utilisateur est déjà pris." }, { status: 409 });
    }
  }

  const updated = await prisma.user.update({
    where: { email: session.user.email },
    data: {
      ...(username    !== undefined && { username }),
      ...(displayName !== undefined && { displayName }),
      ...(bio         !== undefined && { bio }),
      ...(category    !== undefined && { category }),
      ...(location    !== undefined && { location }),
      ...(website     !== undefined && { website }),
      ...(avatar      !== undefined && { avatar }),
    },
    select: {
      id: true, username: true, displayName: true,
      avatar: true, bio: true, category: true,
      location: true, website: true, role: true, isVerified: true,
    },
  });

  // Invalider le cache après modification
  await invalidateCache(`user:me:${session.user.email}`);
  if (username) await invalidateCache(`user:profil:${username}`);

  return NextResponse.json(updated);
}