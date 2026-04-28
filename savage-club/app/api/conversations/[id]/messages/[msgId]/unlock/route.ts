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

  // Contenu payant → créer paiement PENDING + initier MoneyFusion
  const payment = await prisma.payment.create({
    data: {
      id:            crypto.randomUUID(),
      amount:        message.price,
      status:        "PENDING",
      type:          "MESSAGE",
      provider:      "MONEYFUSION",
      platformFee:   Math.round(message.price * 0.1),
      creatorAmount: Math.round(message.price * 0.9),
      description:   "Contenu payant",
      payerId:       user.id,
      recipientId:   message.senderId,
    },
  });

  const PROXY_URL = `${process.env.API_URL}/payments/moneyfusion/create`;
  const APP_URL   = process.env.NEXTAUTH_URL || "https://savage-club.vercel.app";
  let redirectUrl: string | null = null;

  try {
    const mfRes = await fetch(PROXY_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        totalPrice:    message.price,
        article:       [{ savage_club: message.price }],
        numeroSend:    "0000000000",
        nomclient:     user.displayName || user.username || "Utilisateur",
        personal_Info: [{
          paymentId:      payment.id,
          userId:         user.id,
          type:           "MESSAGE_UNLOCK",
          messageId:      msgId,
          conversationId,
        }],
        return_url:  `${APP_URL}/payments/confirm`,
        webhook_url: `${APP_URL}/api/webhooks/moneyfusion`,
      }),
    });

    const mfData = await mfRes.json();
    if (mfData.statut) {
      await prisma.payment.update({
        where: { id: payment.id },
        data:  { providerRef: mfData.token },
      });
      redirectUrl = mfData.url;
    }
  } catch (err) {
    console.error("[Unlock] Erreur MoneyFusion:", err);
  }

  return NextResponse.json({
    requiresPayment: true,
    redirectUrl,
    amount:          message.price,
  });
}
