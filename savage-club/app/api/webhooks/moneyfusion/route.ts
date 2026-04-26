// app/api/webhooks/moneyfusion/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma }                    from "@/lib/prisma";
import type { MFWebhookPayload }     from "@/lib/payments/providers/moneyfusion";

export async function POST(req: NextRequest) {
  try {
    const payload: MFWebhookPayload = await req.json();
    console.log("[MF Webhook]", payload.event, payload.tokenPay);

    // Ignorer les événements non finaux
    if (payload.event === "payin.session.pending") {
      return NextResponse.json({ received: true });
    }

    // Trouver le paiement par token (référence)
    const payment = await prisma.payment.findFirst({
      where: { reference: payload.tokenPay },
    });

    if (!payment) {
      console.error("[MF Webhook] Paiement non trouvé pour token:", payload.tokenPay);
      return NextResponse.json({ error: "Paiement non trouvé" }, { status: 404 });
    }

    // Éviter les doublons
    if (payment.status === "SUCCESS" || payment.status === "FAILED") {
      console.log("[MF Webhook] Paiement déjà traité:", payment.id);
      return NextResponse.json({ received: true });
    }

    if (payload.event === "payin.session.completed") {
      // Paiement réussi
      await prisma.payment.update({
        where: { id: payment.id },
        data:  { status: "SUCCESS" },
      });

      // Récupérer les infos depuis personal_Info
      const info = payload.personal_Info?.[0];

      // Actions selon le type de paiement
      if (info?.type === "SUBSCRIPTION" && info?.userId) {
        // Activer l'abonnement
        await prisma.subscription.updateMany({
          where:  { subscriberId: info.userId, status: "PENDING" },
          data:   { status: "ACTIVE" },
        });
      }

      // Notification au créateur
      await prisma.notification.create({
        data: {
          id:         crypto.randomUUID(),
          type:       "PAYMENT_RECEIVED",
          receiverId: payment.recipientId,
          senderId:   payment.payerId,
          isRead:     false,
        } as any,
      });

      console.log("[MF Webhook] Paiement confirmé:", payment.id);

    } else if (payload.event === "payin.session.cancelled") {
      // Paiement échoué
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
