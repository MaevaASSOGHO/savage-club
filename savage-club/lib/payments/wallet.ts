// lib/payments/wallet.ts

import { prisma } from "@/lib/prisma";
import { PaymentType } from "@prisma/client";
import { WalletTxType } from "@prisma/client";

/**
 * Créditer le wallet d'un utilisateur
 */
export async function creditWallet({
  userId,
  amount,
  type,
  paymentId,
  description,
}: {
  userId: string;
  amount: number;
  type: WalletTxType;
  paymentId?: string;
  description?: string;
}) {
  return await prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new Error("Wallet non trouvé");
    }

    // Mettre à jour le wallet
    const updatedWallet = await tx.wallet.update({
      where: { userId },
      data: {
        balance: { increment: amount },
        totalEarned: { increment: amount },
        updatedAt: new Date(),
      },
    });

    // Créer la transaction
    const transaction = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount,
        type,
        status: "COMPLETED",
        paymentId,
        description,
      },
    });

    return { wallet: updatedWallet, transaction };
  });
}

/**
 * Débiter le wallet d'un utilisateur
 */
export async function debitWallet({
  userId,
  amount,
  type,
  description,
}: {
  userId: string;
  amount: number;
  type: WalletTxType;
  description?: string;
}) {
  return await prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new Error("Wallet non trouvé");
    }

    if (wallet.balance < amount) {
      throw new Error("Solde insuffisant");
    }

    const updatedWallet = await tx.wallet.update({
      where: { userId },
      data: {
        balance: { decrement: amount },
        updatedAt: new Date(),
      },
    });

    const transaction = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: -amount,
        type,
        status: "COMPLETED",
        description,
      },
    });

    return { wallet: updatedWallet, transaction };
  });
}

/**
 * Vérifier le solde d'un utilisateur
 */
export async function getWalletBalance(userId: string) {
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    select: {
      balance: true,
      pending: true,
      totalEarned: true,
      totalWithdrawn: true,
    },
  });

  if (!wallet) {
    return { balance: 0, pending: 0, totalEarned: 0, totalWithdrawn: 0 };
  }

  return wallet;
}