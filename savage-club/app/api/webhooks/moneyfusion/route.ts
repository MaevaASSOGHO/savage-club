// app/api/webhooks/moneyfusion/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma }                    from "@/lib/prisma";
import type { MFWebhookPayload }     from "@/lib/payments/providers/moneyfusion";

export async function POST(req: NextRequest) {
  try {
    const payload: MFWebhookPayload = await req.json();
    console.log("[MF Webhook]", payload.event, payload.tokenPay);

    if (payload.event === "payin.session.pending") {
      return NextResponse.json({ received: true });
    }

    const payment = await prisma.payment.findFirst({
      where: { providerRef: payload.tokenPay },
    });

    if (!payment) {
      console.error("[MF Webhook] Paiement non trouvé:", payload.tokenPay);
      return NextResponse.json({ error: "Paiement non trouvé" }, { status: 404 });
    }

    if (payment.status === "SUCCESS" || payment.status === "FAILED") {
      return NextResponse.json({ received: true });
    }

    const info = payload.personal_Info?.[0] as any;

    if (payload.event === "payin.session.completed") {
      await prisma.payment.update({
        where: { id: payment.id },
        data:  { status: "SUCCESS" },
      });

      // Créer l'abonnement ICI — seulement après confirmation paiement
      if (info?.type === "SUBSCRIPTION" && info?.tier) {
        const existing = await prisma.subscription.findFirst({
          where: { subscriberId: payment.payerId, creatorId: payment.recipientId, status: "ACTIVE" },
        });

        if (existing) {
          await prisma.subscription.update({
            where: { id: existing.id },
            data:  { tier: info.tier, updatedAt: new Date() },
          });
        } else {
          await prisma.subscription.create({
            data: {
              id:           crypto.randomUUID(),
              subscriberId: payment.payerId,
              creatorId:    payment.recipientId,
              tier:         info.tier,
              status:       "ACTIVE",
              startedAt:    new Date(),
              updatedAt:    new Date(), // ← champ requis
            },
          });
        }
      }

      // Notification au créateur
      await prisma.notification.create({
        data: {
          id:         crypto.randomUUID(),
          type:       "FOLLOW",
          receiverId: payment.recipientId,
          senderId:   payment.payerId,
          isRead:     false,
        } as any,
      });

      console.log("[MF Webhook] Paiement + abonnement confirmés:", payment.id);

    } else if (payload.event === "payin.session.cancelled") {
      await prisma.payment.update({
        where: { id: payment.id },
        data:  { status: "FAILED" },
      });
      console.log("[MF Webhook] Paiement annulé:", payment.id);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[MF Webhook] Erreur:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
