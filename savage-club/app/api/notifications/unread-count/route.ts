import { getServerSession, authOptions } from "@/lib/auth-compat";
// app/api/notifications/unread-count/route.ts
import { prisma } from "@/lib/prisma";


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
    return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
  }

  const count = await prisma.notification.count({
    where: {
      receiverId: user.id,
      isRead: false,
    },
  });

  return NextResponse.json({ count });
}