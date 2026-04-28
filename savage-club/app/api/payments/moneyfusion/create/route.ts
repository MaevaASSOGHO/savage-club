// app/api/payments/moneyfusion/create/route.ts
import { getServerSession, authOptions } from "@/lib/auth-compat";
import { NextRequest, NextResponse }      from "next/server";
import { createMFPayment }                from "@/lib/payments/providers/moneyfusion";
import { prisma }                         from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    }

    const { amount, type, recipientId, description, phoneNumber } = await req.json();

    if (!amount || !type || !recipientId || !phoneNumber) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }
    console.log("[MF Create] Step 1 - body:", { amount, type, recipientId, phoneNumber });

    const user = await prisma.user.findUnique({
      where:  { email: session.user.email },
      select: { id: true, username: true, displayName: true, email: true },
    });
    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    console.log("[MF Create] Step 2 - user:", user?.id);

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

    console.log("[MF Create] Step 3 - payment créé:", payment.id);

    const mfResponse = await createMFPayment({
      amount,
      phoneNumber,
      clientName: user.displayName ?? user.username ?? "Utilisateur",
      paymentId:  payment.id,
      userId:     user.id,
      type,
    });

    console.log("[MF Create] Step 4 - MF response:", mfResponse.token);

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
    console.error("[MF Create] Erreur:", JSON.stringify(err, null, 2));
    return NextResponse.json({ error: err.message ?? "Erreur inconnue" }, { status: 500 });
  }
}
