import { NextResponse } from "next/server";
import { stripe } from "@/lib/payments/stripe";
import { prisma } from "@/lib/prisma";
import { splitPayment, settlePayment } from "@/lib/payments/paymentService";
import { PaymentType } from "@prisma/client/wasm";

export async function POST(req: Request) {
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Signature manquante" }, { status: 400 });
  }

  let event: import("stripe").Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook invalide: ${err.message}` }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as import("stripe").Stripe.PaymentIntent;
    const { paymentId, type } = intent.metadata;

    if (!paymentId || !type) {
      return NextResponse.json({ error: "Metadata manquante" }, { status: 400 });
    }

    const { platformFee, creatorAmount } = splitPayment(intent.amount, type as PaymentType);

    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        providerRef:   intent.id,
        platformFee,
        creatorAmount,
      },
    });

    await settlePayment(paymentId);
  }

  return NextResponse.json({ received: true });
}