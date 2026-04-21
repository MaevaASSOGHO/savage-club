// app/api/me/subscriptions/route.ts
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export async function GET() {
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

  const subscriptions = await prisma.subscription.findMany({
    where: { 
      subscriberId: user.id, 
      status: "ACTIVE" 
    },
    orderBy: { startedAt: "desc" },
    include: {
      User_Subscription_creatorIdToUser: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          category: true,
        },
      },
    },
  });

  // ✅ Formater les données pour correspondre à ce qu'attend le frontend
  const formattedSubscriptions = subscriptions.map(sub => ({
    id: sub.id,
    tier: sub.tier,
    status: sub.status,
    startedAt: sub.startedAt,
    renewsAt: sub.renewsAt,
    creator: {
      id: sub.User_Subscription_creatorIdToUser.id,
      username: sub.User_Subscription_creatorIdToUser.username,
      displayName: sub.User_Subscription_creatorIdToUser.displayName,
      avatar: sub.User_Subscription_creatorIdToUser.avatar,
      category: sub.User_Subscription_creatorIdToUser.category,
    }
  }));

  return NextResponse.json(formattedSubscriptions);
}