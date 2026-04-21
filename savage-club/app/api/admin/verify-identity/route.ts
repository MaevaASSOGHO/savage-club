// app/api/admin/verify-identity/route.ts
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

  // Vérifier que c'est un admin
  if (admin?.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { userId, approved, reason } = await req.json();

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
  }

  // Créer la notification
  await prisma.notification.create({
    data: {
      id: crypto.randomUUID(),
      type: approved ? "IDENTITY_VERIFIED" : "IDENTITY_REJECTED",
      reason: approved ? null : reason || "Document non conforme",
      isRead: false,
      User_Notification_receiverIdToUser: {
      connect: { id: userId },
      },
    },
  });


  // Si approuvé, mettre à jour le rôle et le statut de vérification
  if (approved) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        isVerified: true,
        idVerified: true,
        role: user.role === "USER" ? "CREATOR" : user.role, // Devient créateur si USER
      },
    });

    // Créer l'agrément
    await prisma.creatorAgreement.create({
      data: {
        id: `agreement_${userId}_${Date.now()}`,
        userId: userId,
        version: "1.0",
        acceptedAt: new Date(),
      },
    });
  }

  return NextResponse.json({ success: true });
}