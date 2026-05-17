// app/api/wallet/route.ts

import { prisma as prismaWallet } from "@/lib/prisma";
import { NextResponse as NRW }    from "next/server";
import { getSessionUser as gsu }  from "@/lib/get-session-user";

export async function GET() {
  const user = await gsu();
  if (!user) return NRW.json({ error: "Non connecté" }, { status: 401 });

  const wallet = await prismaWallet.wallet.upsert({
    where:   { userId: user.id },
    create:  { userId: user.id, balance: 0, pending: 0, totalEarned: 0, totalWithdrawn: 0 },
    update:  {},
    include: {
      WalletTransaction: { orderBy: { createdAt: "desc" }, take: 20 },
      Withdrawal:        { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  return NRW.json({
    balance:        wallet.balance,
    pending:        wallet.pending,
    totalEarned:    wallet.totalEarned,
    totalWithdrawn: wallet.totalWithdrawn,
    transactions:   wallet.WalletTransaction,
    withdrawals:    wallet.Withdrawal,
    canWithdraw:    (user.role === "CREATOR" || user.role === "TRAINER") && user.isVerified,
  });
}