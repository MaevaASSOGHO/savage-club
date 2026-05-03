// app/api/conversations/[id]/messages/[msgId]/unlock/route.ts
import { getServerSession, authOptions } from "@/lib/auth-compat";
import { prisma }                        from "@/lib/prisma";
import { NextResponse }                  from "next/server";

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
    where:  { email: session.user.email },
    select: { id: true, username: true, displayName: true },
  });
  if (!user) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const message = await prisma.message.findUnique({
    where:  { id: msgId },
    select: {
      id: true, content: true, mediaUrl: true, mediaType: true,
      iv: true, price: true, isUnlocked: true, senderId: true,
      conversationId: true,
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

  // Contenu gratuit → débloquer directement
  if (!message.price || message.price === 0) {
    await prisma.message.update({ where: { id: msgId }, data: { isUnlocked: true } });
    return NextResponse.json({ ...message, isUnlocked: true, locked: false });
  }

  // Contenu payant → juste retourner les infos
  // PaymentMethodSelector gère la création du paiement (MF ou Stripe)
  return NextResponse.json({
    requiresPayment: true,
    amount:          message.price,
    senderId:        message.senderId,
    messageId:       msgId,
    conversationId,
  });
}
