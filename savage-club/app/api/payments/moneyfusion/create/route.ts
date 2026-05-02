// app/api/payments/moneyfusion/create/route.ts
import { getServerSession, authOptions } from "@/lib/auth-compat";
import { NextRequest, NextResponse }     from "next/server";
import { createMFPayment }               from "@/lib/payments/providers/moneyfusion";
import { prisma }                        from "@/lib/prisma";

const APP_URL = process.env.NEXTAUTH_URL || "https://savage-club.vercel.app";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    }

    const { amount, type, recipientId, description, tier, returnTo } = await req.json();

    if (!amount || !type || !recipientId) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where:  { email: session.user.email },
      select: { id: true, username: true, displayName: true },
    });
    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

    const payment = await prisma.payment.create({
      data: {
        id:            crypto.randomUUID(),
        payerId:       user.id,
        recipientId,
        amount,
        platformFee:   Math.round(amount * 0.1),
        creatorAmount: Math.round(amount * 0.9),
        status:        "PENDING",
        type,
        provider:      "MONEYFUSION",
        description:   description ?? null,
      },
    });

    // Appel MoneyFusion sans numéro — MF le demande sur leur page
    const mfResponse = await createMFPayment({
      amount,
      clientName: user.displayName || user.username || "Utilisateur",
      paymentId:  payment.id,
      userId:     user.id,
      type,
      tier:       tier ?? "",
      returnUrl:  `${APP_URL}/payments/confirm?returnTo=${encodeURIComponent(returnTo ?? "/")}`,

    });

    await prisma.payment.update({
      where: { id: payment.id },
      data:  { providerRef: mfResponse.token },
    });

    return NextResponse.json({
      paymentId:   payment.id,
      token:       mfResponse.token,
      redirectUrl: mfResponse.url,
      message:     mfResponse.message,
    });

  } catch (err: any) {
    console.error("[MF Create] Erreur:", err.message);
    return NextResponse.json({ error: err.message ?? "Erreur inconnue" }, { status: 500 });
  }
}
