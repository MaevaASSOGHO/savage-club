// app/api/admin/withdrawals/route.ts
import { getServerSession, authOptions } from "@/lib/auth-compat";
import { prisma }                        from "@/lib/prisma";
import { NextResponse }                  from "next/server";

// GET — liste des retraits en attente
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const admin = await prisma.user.findUnique({
    where:  { email: session.user.email },
    select: { role: true },
  });
  if (admin?.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const withdrawals = await prisma.withdrawal.findMany({
    where:   { status: { in: ["PENDING", "PROCESSING"] } },
    orderBy: { createdAt: "asc" },
    include: {
      Wallet: {
        include: {
          User: {
            select: { id: true, username: true, displayName: true, email: true, avatar: true },
          },
        },
      },
    },
  });

  return NextResponse.json(withdrawals.map((w) => ({
    id:          w.id,
    amount:      w.amount,
    fee:         w.fee,
    net:         w.net,
    status:      w.status,
    phoneNumber: w.phoneNumber,
    createdAt:   w.createdAt,
    user:        w.Wallet.User,
  })));
}

// PATCH — valider ou rejeter un retrait
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const admin = await prisma.user.findUnique({
    where:  { email: session.user.email },
    select: { role: true },
  });
  if (admin?.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { withdrawalId, action, reason } = await req.json();
  // action = "approve" | "reject"

  const withdrawal = await prisma.withdrawal.findUnique({
    where:   { id: withdrawalId },
    include: { Wallet: true },
  });
  if (!withdrawal) {
    return NextResponse.json({ error: "Retrait introuvable" }, { status: 404 });
  }

  if (action === "approve") {
    await prisma.$transaction(async (tx) => {
      await tx.withdrawal.update({
        where: { id: withdrawalId },
        data:  { status: "COMPLETED", processedAt: new Date() },
      });
      // Libérer le pending et mettre à jour totalWithdrawn
      await tx.wallet.update({
        where: { id: withdrawal.walletId },
        data: {
          pending:        { decrement: withdrawal.amount },
          totalWithdrawn: { increment: withdrawal.amount },
        },
      });
      // Mettre à jour la transaction wallet
      await tx.walletTransaction.updateMany({
        where: { walletId: withdrawal.walletId, type: "WITHDRAWAL", status: "PENDING" },
        data:  { status: "COMPLETED" },
      });
    });
  } else if (action === "reject") {
    await prisma.$transaction(async (tx) => {
      await tx.withdrawal.update({
        where: { id: withdrawalId },
        data:  { status: "REJECTED", processedAt: new Date() },
      });
      // Rembourser le solde
      await tx.wallet.update({
        where: { id: withdrawal.walletId },
        data: {
          balance: { increment: withdrawal.amount },
          pending: { decrement: withdrawal.amount },
        },
      });
      // Annuler la transaction wallet
      await tx.walletTransaction.updateMany({
        where: { walletId: withdrawal.walletId, type: "WITHDRAWAL", status: "PENDING" },
        data:  { status: "FAILED" },
      });
    });
  }

  return NextResponse.json({ success: true });
}
