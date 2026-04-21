// app/api/payments/moneyfusion/create/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { moneyFusion } from "@/lib/payments/providers/moneyfusion";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const { amount, type, recipientId, description } = await req.json();

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, username: true, email: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
  }

  // Créer le paiement en base
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
      provider: "MONEYFUSION",
      reference: `SAVAGE-${type}-${Date.now()}`,
    },
  });

  // Créer le paiement MoneyFusion
  const result = await moneyFusion.createPayment({
    amount,
    currency: "XOF",
    customerName: user.username,
    customerEmail: user.email,
    customerPhone: "00000000",
    description: description || `${type} - ${user.username}`,
    reference: payment.reference!,
    returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payments/moneyfusion/confirm?paymentId=${payment.id}`,
  });

  return NextResponse.json({
    checkoutUrl: result.data.checkoutUrl,
    paymentId: payment.id,
    reference: result.data.reference,
  });
}