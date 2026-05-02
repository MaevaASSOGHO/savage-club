// app/api/payments/stripe/create/route.ts
import { getServerSession, authOptions } from "@/lib/auth-compat";
import { NextRequest, NextResponse }     from "next/server";
import { stripe }                        from "@/lib/payments/providers/stripe";
import { prisma }                        from "@/lib/prisma";

// Taux de conversion FCFA → EUR (configurable via env)
const FCFA_TO_EUR = parseFloat(process.env.FCFA_TO_EUR_RATE ?? "0.00152");

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const {
    amount, type, recipientId, description,
    tier, bookingData, messageId, conversationId,
  } = await req.json();

  const user = await prisma.user.findUnique({
    where:  { email: session.user.email },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });

  const platformFee   = Math.round(amount * 0.1);
  const creatorAmount = amount - platformFee;

  // Créer le paiement en base en FCFA
  const payment = await prisma.payment.create({
    data: {
      id:            crypto.randomUUID(),
      payerId:       user.id,
      recipientId,
      amount,        // ← stocké en FCFA
      platformFee,
      creatorAmount,
      status:        "PENDING",
      type,
      provider:      "STRIPE",
      description:   description ?? null,
    },
  });

  // Convertir en centimes EUR pour Stripe
  const amountInEurCents = Math.max(50, Math.round(amount * FCFA_TO_EUR * 100)); // min 0.50 EUR

  // Métadonnées pour le webhook
  const metadata: Record<string, string> = {
    paymentId:   payment.id,
    userId:      user.id,
    recipientId,
    type,
    amountFcfa:  amount.toString(), // garder le montant FCFA original
  };
  if (tier)           metadata.tier           = tier;
  if (messageId)      metadata.messageId      = messageId;
  if (conversationId) metadata.conversationId = conversationId;
  if (bookingData)    metadata.bookingData    = JSON.stringify(bookingData);

  // Créer le PaymentIntent Stripe en EUR
  const { clientSecret, paymentIntentId } = await stripe.createPaymentIntent(
    amountInEurCents,
    "eur",
    metadata,
  );

  await prisma.payment.update({
    where: { id: payment.id },
    data:  { reference: paymentIntentId },
  });

  return NextResponse.json({
    clientSecret,
    paymentId:       payment.id,
    paymentIntentId,
    amountFcfa:      amount,
    amountEur:       (amountInEurCents / 100).toFixed(2),
  });
}
