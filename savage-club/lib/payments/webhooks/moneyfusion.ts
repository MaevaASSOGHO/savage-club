// lib/payments/webhooks/moneyfusion.ts

import { prisma } from "@/lib/prisma";
import { creditWallet } from "@/lib/payments/wallet";

export async function handlePaymentSuccess(data: any) {
  const { reference, amount, transactionId, paidAt, paymentMethod } = data;

  // Utiliser findFirst avec reference au lieu de findUnique
  const payment = await prisma.payment.findFirst({
    where: { reference: reference },
    include: { User_Payment_recipientIdToUser: true },
  });

  if (!payment) {
    console.error("Paiement non trouvé:", reference);
    return;
  }

  // Mettre à jour le statut du paiement - sans metadata
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "SUCCESS",
      providerRef: transactionId,
      // Les champs disponibles dans ton modèle Payment
      // platformFee et creatorAmount sont déjà définis ailleurs
    },
  });

  // Créditer le wallet du destinataire
  await creditWallet({
    userId: payment.recipientId,
    amount: payment.creatorAmount,
    type: getWalletTxType(payment.type),
    paymentId: payment.id,
    description: `Paiement via MoneyFusion - ${payment.type}`,
  });
}

export async function handlePaymentFailed(data: any) {
  const { reference, message } = data;

  const payment = await prisma.payment.findFirst({
    where: { reference: reference },
  });

  if (payment) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "FAILED",
      },
    });
  }
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