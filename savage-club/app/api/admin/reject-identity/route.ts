// app/api/admin/reject-identity/route.ts
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const admin = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (admin?.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { userId, reason } = await req.json();

  if (!reason || reason.trim() === "") {
    return NextResponse.json({ error: "Une raison est requise" }, { status: 400 });
  }

  // Créer la notification avec la raison
  await prisma.notification.create({
    data: {
      id: crypto.randomUUID(),
      type: "IDENTITY_REJECTED",
      reason: reason,
      isRead: false,
      User_Notification_receiverIdToUser: {
      connect: { id: userId },
      },
    },
  });

  // Optionnel : mettre à jour le statut de l'utilisateur
  await prisma.user.update({
    where: { id: userId },
    data: {
      idVerified: false,
      // Ne pas changer le rôle, rester en attente
    },
  });

  return NextResponse.json({ success: true });
}