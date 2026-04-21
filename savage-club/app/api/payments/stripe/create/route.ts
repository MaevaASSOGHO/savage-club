// app/api/payments/stripe/create/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { stripe } from "@/lib/payments/providers/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const { amount, currency, type, recipientId, description } = await req.json();

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
  }

  // Créer le paiement en base avec statut PENDING
  const payment = await prisma.payment.create({
    data: {
      id: crypto.randomUUID(),
      payerId: user.id,
      recipientId,
      amount,
      platformFee: 0,
      creatorAmount: amount,
      status: "PENDING",
      type,
      provider: "STRIPE",
    },
  });

  // Créer le PaymentIntent Stripe
  const { clientSecret, paymentIntentId } = await stripe.createPaymentIntent(
    amount,
    currency,
    {
      paymentId: payment.id,
      userId: user.id,
      recipientId,
      type,
    }
  );

  // Mettre à jour le paiement avec la référence Stripe
  await prisma.payment.update({
    where: { id: payment.id },
    data: { reference: paymentIntentId },
  });

  return NextResponse.json({
    clientSecret,
    paymentId: payment.id,
    paymentIntentId,
  });
}