import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { splitPayment, settlePayment } from "@/lib/payments/paymentService";

export async function POST(req: Request) {
  const body = await req.json();

  // MoneyFusion envoie le statut et les personal_Info
  const { statut, token, personal_Info } = body;

  if (statut !== "paid") {
    return NextResponse.json({ received: true });
  }

  const { paymentId, type } = personal_Info?.[0] ?? {};

  if (!paymentId || !type) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }

  // Vérifier que ce paymentId n'a pas déjà été traité (idempotence)
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });

  if (!payment || payment.status === "SUCCESS") {
    return NextResponse.json({ received: true });
  }

  const { platformFee, creatorAmount } = splitPayment(payment.amount, type);

  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      providerRef:   token,
      platformFee,
      creatorAmount,
    },
  });

  await settlePayment(paymentId);

  return NextResponse.json({ received: true });
}