import { getServerSession, authOptions } from "@/lib/auth-compat";
// app/api/conversations/[id]/messages/[msgId]/unlock/route.ts
import { prisma } from "@/lib/prisma";


import { NextResponse } from "next/server";
import { decryptMessage } from "@/lib/encryption";

// POST /api/conversations/[id]/messages/[msgId]/unlock
// Débloquer un contenu payant après paiement simulé
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; msgId: string }> }
) {
  const { id: conversationId, msgId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const message = await prisma.message.findUnique({
    where: { id: msgId },
    select: {
      id: true, content: true, mediaUrl: true, mediaType: true,
      iv: true, price: true, isUnlocked: true, senderId: true,
      conversationId: true,
      User: { select: { id: true, username: true } },
    },
  });

  if (!message || message.conversationId !== conversationId) {
    return NextResponse.json({ error: "Message introuvable" }, { status: 404 });
  }
  if (message.senderId === user.id) {
    return NextResponse.json({ error: "Vous êtes l'expéditeur" }, { status: 400 });
  }
  if (message.isUnlocked) {
    return NextResponse.json({ error: "Déjà débloqué" }, { status: 400 });
  }

  // Simuler le paiement + enregistrer
  await prisma.$transaction(async (tx) => {
    await tx.message.update({
      where: { id: msgId },
      data: { isUnlocked: true },
    });

    if (message.price && message.price > 0) {
      await tx.payment.create({
        data: {
          id:          crypto.randomUUID(),
          amount:      message.price,
          status:      "SUCCESS",
          type:        "MESSAGE",
          description: `Contenu payant débloqué`,
          reference:   `SIM-${Date.now()}`,
          payerId:     user.id,
          recipientId: message.senderId,
        },
      });
    }
  });

  // Retourner le message déchiffré
  const dec = decryptMessage({ content: message.content, mediaUrl: message.mediaUrl, iv: message.iv });
  return NextResponse.json({ ...message, ...dec, isUnlocked: true, locked: false });
}
