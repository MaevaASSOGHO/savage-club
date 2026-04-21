import { prisma } from "../prisma";
import { COMMISSION_RATES } from "./constants";
import { PaymentType, WalletTxType } from "@prisma/client";

function mapPaymentTypeToTxType(type: PaymentType): WalletTxType {
  const map: Record<PaymentType, WalletTxType> = {
    SUBSCRIPTION:   WalletTxType.SUBSCRIPTION_EARNING,
    MESSAGE:        WalletTxType.TIP_EARNING,
    AUDIO_CALL:     WalletTxType.BOOKING_EARNING,
    VIDEO_CALL:     WalletTxType.BOOKING_EARNING,
    CUSTOM_CONTENT: WalletTxType.PPV_EARNING,
  };
  return map[type];
}

export function splitPayment(amount: number, type: PaymentType) {
  const rate = COMMISSION_RATES[type] ?? 0.15;
  const platformFee = Math.round(amount * rate);
  const creatorAmount = amount - platformFee;
  return { platformFee, creatorAmount };
}

export async function settlePayment(paymentId: string) {
  const payment = await prisma.payment.findUniqueOrThrow({
    where: { id: paymentId },
  });

  // Upsert wallet hors transaction pour récupérer l'id
  const wallet = await prisma.wallet.upsert({
    where: { userId: payment.recipientId },
    create: {
      userId:      payment.recipientId,
      balance:     0,
      totalEarned: 0,
    },
    update: {},
  });

  await prisma.$transaction([
    prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance:     { increment: payment.creatorAmount },
        totalEarned: { increment: payment.creatorAmount },
      },
    }),
    prisma.walletTransaction.create({
      data: {
        walletId:    wallet.id,
        amount:      payment.creatorAmount,
        type:        mapPaymentTypeToTxType(payment.type),
        paymentId:   payment.id,
        description: payment.description ?? undefined,
      },
    }),
    prisma.payment.update({
      where: { id: paymentId },
      data: { status: "SUCCESS" as any },
    }),
  ]);
}