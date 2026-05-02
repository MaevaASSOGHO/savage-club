// app/api/payments/stripe/create/route.ts
import { getServerSession, authOptions } from "@/lib/auth-compat";
import { NextRequest, NextResponse }     from "next/server";
import { stripe }                        from "@/lib/payments/providers/stripe";
import { prisma }                        from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const {
    amount, currency, type, recipientId, description,
    // Métadonnées spécifiques selon le type
    tier,           // SUBSCRIPTION
    bookingData,    // BOOKING (scheduledAt, note, etc.)
    messageId,      // MESSAGE_UNLOCK
    conversationId, // MESSAGE_UNLOCK
  } = await req.json();

  const user = await prisma.user.findUnique({
    where:  { email: session.user.email },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });

  const platformFee   = Math.round(amount * 0.1);
  const creatorAmount = amount - platformFee;

  // Créer le paiement en base PENDING
  const payment = await prisma.payment.create({
    data: {
      id:            crypto.randomUUID(),
      payerId:       user.id,
      recipientId,
      amount,
      platformFee,
      creatorAmount,
      status:        "PENDING",
      type,
      provider:      "STRIPE",
      description:   description ?? null,
    },
  });

  // Métadonnées pour le webhook Stripe
  const metadata: Record<string, string> = {
    paymentId:   payment.id,
    userId:      user.id,
    recipientId,
    type,
  };
  if (tier)           metadata.tier           = tier;
  if (messageId)      metadata.messageId      = messageId;
  if (conversationId) metadata.conversationId = conversationId;
  if (bookingData)    metadata.bookingData    = JSON.stringify(bookingData);

  // Créer le PaymentIntent Stripe
  const { clientSecret, paymentIntentId } = await stripe.createPaymentIntent(
    amount,
    currency ?? "xof",
    metadata,
  );

  // Sauvegarder la référence Stripe
  await prisma.payment.update({
    where: { id: payment.id },
    data:  { reference: paymentIntentId },
  });

  return NextResponse.json({
    clientSecret,
    paymentId:       payment.id,
    paymentIntentId,
  });
}
