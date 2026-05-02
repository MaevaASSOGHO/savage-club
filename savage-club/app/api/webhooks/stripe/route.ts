// app/api/webhooks/stripe/route.ts
import { NextResponse }                          from "next/server";
import { stripe }                                from "@/lib/payments/stripe";
import { prisma }                                from "@/lib/prisma";
import { splitPayment, settlePayment }           from "@/lib/payments/paymentService";
import { PaymentType }                           from "@prisma/client/wasm";

export async function POST(req: Request) {
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Signature manquante" }, { status: 400 });
  }

  let event: import("stripe").Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook invalide: ${err.message}` }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as import("stripe").Stripe.PaymentIntent;
    const {
      paymentId, type, recipientId, userId,
      tier, messageId, conversationId, bookingData,
    } = intent.metadata;

    if (!paymentId || !type) {
      return NextResponse.json({ error: "Metadata manquante" }, { status: 400 });
    }

    // 1. Mettre à jour le paiement et créditer le wallet
    const { platformFee, creatorAmount } = splitPayment(intent.amount, type as PaymentType);
    await prisma.payment.update({
      where: { id: paymentId },
      data:  { providerRef: intent.id, platformFee, creatorAmount },
    });
    await settlePayment(paymentId);

    // 2. Actions spécifiques selon le type
    switch (type) {

      case "SUBSCRIPTION": {
        if (!tier || !userId || !recipientId) break;
        const existing = await prisma.subscription.findFirst({
          where: { subscriberId: userId, creatorId: recipientId, status: "ACTIVE" },
        });
        if (existing) {
          await prisma.subscription.update({
            where: { id: existing.id },
              data:  { tier: tier as any, updatedAt: new Date() },
          });
        } else {
          await prisma.subscription.create({
            data: {
              id:           crypto.randomUUID(),
              subscriberId: userId,
              creatorId:    recipientId,
              tier:         tier as any,
              status:       "ACTIVE",
              startedAt:    new Date(),
              updatedAt:    new Date(),
            },
          });
        }
        await prisma.notification.create({
          data: {
            id:         crypto.randomUUID(),
            type:       "FOLLOW",
            receiverId: recipientId,
            senderId:   userId,
            isRead:     false,
          } as any,
        });
        break;
      }

      case "AUDIO_CALL":
      case "VIDEO_CALL": {
        if (!bookingData) break;
        let bd: any;
        try { bd = JSON.parse(bookingData); } catch { break; }

        // Créer la réservation
        const booking = await prisma.booking.create({
          data: {
            id:          crypto.randomUUID(),
            type:        type as any,
            status:      "PENDING_CONFIRM",
            scheduledAt: new Date(bd.scheduledAt),
            duration:    10,
            amount:      intent.amount,
            reference:   `STRIPE_${intent.id}`,
            note:        bd.note ?? null,
            updatedAt:   new Date(),
            User_Booking_requesterIdToUser: { connect: { id: userId } },
            User_Booking_creatorIdToUser:   { connect: { id: recipientId } },
          },
        });

        // Notifier le créateur
        await prisma.notification.create({
          data: {
            id:         crypto.randomUUID(),
            type:       "BOOKING",
            receiverId: recipientId,
            senderId:   userId,
            bookingId:  booking.id,
            isRead:     false,
          } as any,
        });
        break;
      }

      case "MESSAGE": {
        if (!messageId) break;
        // Débloquer le message
        await prisma.message.update({
          where: { id: messageId },
          data:  { isUnlocked: true },
        });
        // Notifier le créateur
        await prisma.notification.create({
          data: {
            id:         crypto.randomUUID(),
            type:       "PAYMENT_RECEIVED" as any,
            receiverId: recipientId,
            senderId:   userId,
            isRead:     false,
          } as any,
        });
        break;
      }
    }

    console.log("[Stripe Webhook] Paiement confirmé:", paymentId, type);
  }

  return NextResponse.json({ received: true });
}
