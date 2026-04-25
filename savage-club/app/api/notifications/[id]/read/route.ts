import { getServerSession, authOptions } from "@/lib/auth-compat";
// app/api/notifications/[id]/read/route.ts
import { prisma } from "@/lib/prisma";

import { NextResponse, NextRequest } from "next/server";


export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } // ✅ FIX
) {
  try {
    const { id } = await context.params; // ✅ FIX

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    await prisma.notification.updateMany({
      where: {
        id: id, // ✅ FIX
        receiverId: user.id,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}