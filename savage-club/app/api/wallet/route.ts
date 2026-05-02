// app/api/wallet/route.ts
import { getServerSession, authOptions } from "@/lib/auth-compat";
import { prisma }                        from "@/lib/prisma";
import { NextResponse }                  from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where:  { email: session.user.email },
    select: { id: true, role: true, isVerified: true },
  });
  if (!user) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  // Récupérer ou créer le wallet
  const wallet = await prisma.wallet.upsert({
    where:  { userId: user.id },
    create: { userId: user.id, balance: 0, pending: 0, totalEarned: 0, totalWithdrawn: 0 },
    update: {},
    include: {
      WalletTransaction: {
        orderBy: { createdAt: "desc" },
        take:    20,
      },
      Withdrawal: {
        orderBy: { createdAt: "desc" },
        take:    10,
      },
    },
  });

  return NextResponse.json({
    balance:        wallet.balance,
    pending:        wallet.pending,
    totalEarned:    wallet.totalEarned,
    totalWithdrawn: wallet.totalWithdrawn,
    transactions:   wallet.WalletTransaction,
    withdrawals:    wallet.Withdrawal,
    canWithdraw:    (user.role === "CREATOR" || user.role === "TRAINER") && user.isVerified,
  });
}
