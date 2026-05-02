// app/api/webhooks/moneyfusion-payout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma }                    from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const { event, tokenPay, montant } = payload;

    console.log("[MF Payout Webhook]", event, tokenPay);

    const withdrawal = await prisma.withdrawal.findFirst({
      where: { reference: tokenPay },
      include: { Wallet: true },
    });

    if (!withdrawal) {
      console.error("[MF Payout] Retrait non trouvé:", tokenPay);
      return NextResponse.json({ received: true });
    }

    if (event === "payout.session.completed") {
      await prisma.$transaction(async (tx) => {
        await tx.withdrawal.update({
          where: { id: withdrawal.id },
          data:  { status: "COMPLETED", processedAt: new Date() },
        });
        await tx.wallet.update({
          where: { id: withdrawal.walletId },
          data: {
            pending:        { decrement: withdrawal.amount },
            totalWithdrawn: { increment: withdrawal.amount },
          },
        });
        await tx.walletTransaction.updateMany({
          where: { walletId: withdrawal.walletId, type: "WITHDRAWAL", status: "PENDING" },
          data:  { status: "COMPLETED" },
        });
      });
      console.log("[MF Payout] Retrait confirmé:", withdrawal.id);

    } else if (event === "payout.session.cancelled") {
      await prisma.$transaction(async (tx) => {
        await tx.withdrawal.update({
          where: { id: withdrawal.id },
          data:  { status: "FAILED", processedAt: new Date() },
        });
        // Rembourser le solde
        await tx.wallet.update({
          where: { id: withdrawal.walletId },
          data: {
            balance: { increment: withdrawal.amount },
            pending: { decrement: withdrawal.amount },
          },
        });
        await tx.walletTransaction.updateMany({
          where: { walletId: withdrawal.walletId, type: "WITHDRAWAL", status: "PENDING" },
          data:  { status: "FAILED" },
        });
      });
      console.log("[MF Payout] Retrait échoué — remboursé:", withdrawal.id);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[MF Payout Webhook] Erreur:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
