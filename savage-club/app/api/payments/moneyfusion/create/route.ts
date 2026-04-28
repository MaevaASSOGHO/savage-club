// app/api/payments/moneyfusion/create/route.ts
import { getServerSession, authOptions } from "@/lib/auth-compat";
import { NextRequest, NextResponse }      from "next/server";
import { createMFPayment }                from "@/lib/payments/providers/moneyfusion";
import { prisma }                         from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const { amount, type, recipientId, description, phoneNumber } = await req.json();

  if (!amount || !type || !recipientId || !phoneNumber) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where:  { email: session.user.email },
    select: { id: true, username: true, displayName: true, email: true },
  });
  if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  // Créer le paiement en base avec statut PENDING
  const payment = await prisma.payment.create({
    data: {
      id:            crypto.randomUUID(),
      payerId:       user.id,
      recipientId,
      amount,
      platformFee:   Math.round(amount * 0.1),
      creatorAmount: Math.round(amount * 0.9),
      status:        "PENDING",
      type,
      provider:      "MONEYFUSION",
      description:   description ?? null,
    },
  });

  // Initier le paiement MoneyFusion
  const mfResponse = await createMFPayment({
    amount,
    phoneNumber,
    clientName: user.displayName ?? user.username,
    paymentId:  payment.id,
    userId:     user.id,
    type,
  });

  // Sauvegarder le token MoneyFusion comme référence
  await prisma.payment.update({
    where: { id: payment.id },
    data:  { providerRef: mfResponse.token },
  });

  return NextResponse.json({
    paymentId:   payment.id,
    token:       mfResponse.token,
    redirectUrl: mfResponse.url,
    message:     mfResponse.message,
  });
}
