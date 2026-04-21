// app/api/payments/moneyfusion/confirm/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { moneyFusion } from "@/lib/payments/providers/moneyfusion";
import { creditWallet } from "@/lib/payments/wallet";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const paymentId = searchParams.get("paymentId");
  const reference = searchParams.get("reference");
  const status = searchParams.get("status");

  if (!paymentId) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/payments/failed`);
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });

  if (!payment) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/payments/failed`);
  }

  if (status === "success") {
    try {
      // Vérifier le statut réel auprès de MoneyFusion
      const verification = await moneyFusion.checkPaymentStatus(reference || payment.reference!);

      if (verification.data.status === "SUCCESS") {
        // Mettre à jour le paiement
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "SUCCESS",
          },
        });

        // Créditer le wallet
        await creditWallet({
          userId: payment.recipientId,
          amount: payment.creatorAmount,
          type: getWalletTxType(payment.type),
          paymentId: payment.id,
          description: `Paiement MoneyFusion - ${payment.type}`,
        });

        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/payments/success`);
      }
    } catch (error) {
      console.error("Erreur vérification paiement:", error);
    }
  }

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/payments/failed`);
}

function getWalletTxType(paymentType: string): any {
  switch (paymentType) {
    case "SUBSCRIPTION":
      return "SUBSCRIPTION_EARNING";
    case "CUSTOM_CONTENT":
      return "PPV_EARNING";
    case "AUDIO_CALL":
    case "VIDEO_CALL":
      return "BOOKING_EARNING";
    default:
      return "TIP_EARNING";
  }
}