// app/api/payments/stripe/create/route.ts
import { getServerSession, authOptions } from "@/lib/auth-compat";
import { NextRequest, NextResponse }     from "next/server";
import { stripe }                        from "@/lib/payments/providers/stripe";
import { prisma }                        from "@/lib/prisma";
import { captureApiError } from "@/lib/sentry";

// Taux de conversion FCFA → EUR (configurable via env)
const FCFA_TO_EUR = parseFloat(process.env.FCFA_TO_EUR_RATE ?? "0.00152");

let type: string | undefined;
let amount: number | undefined;
let recipientId: string | undefined;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    }

    const {
      amount, type, recipientId, description,
      tier, bookingData, messageId, conversationId, postId,
    } = await req.json();

    const user = await prisma.user.findUnique({
      where:  { email: session.user.email },
      select: { id: true },
    });
    if (!user) return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });

    const platformFee   = Math.round(amount * 0.1);
    const creatorAmount = amount - platformFee;

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

    const amountInEurCents = Math.max(50, Math.round(amount * FCFA_TO_EUR * 100));

    const metadata: Record<string, string> = {
      paymentId:   payment.id,
      userId:      user.id,
      recipientId,
      type,
      amountFcfa:  amount.toString(),
    };
    if (tier)           metadata.tier           = tier;
    if (messageId)      metadata.messageId      = messageId;
    if (conversationId) metadata.conversationId = conversationId;
    if (bookingData)    metadata.bookingData    = JSON.stringify(bookingData);
    if (postId)         metadata.postId         = postId;

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

  } catch (err) {
    return captureApiError(err, {
      route: "stripe/create",
      type,
      amount,
      recipientId,
    });
  }
}
