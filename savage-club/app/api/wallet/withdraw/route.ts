// app/api/wallet/withdraw/route.ts
import { getServerSession, authOptions } from "@/lib/auth-compat";
import { prisma }                        from "@/lib/prisma";
import { NextResponse }                  from "next/server";

const MIN_WITHDRAWAL = 5000;
const AUTO_THRESHOLD = 200000;
const MF_FEE_RATE    = 0.02;
const APP_URL        = process.env.NEXTAUTH_URL || "https://savage-club.vercel.app";
const RAILWAY_URL    = process.env.API_URL       || "https://awake-reflection-production-df19.up.railway.app";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where:  { email: session.user.email },
    select: { id: true, role: true, isVerified: true, displayName: true, username: true },
  });
  if (!user) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  if (user.role !== "CREATOR" && user.role !== "TRAINER") {
    return NextResponse.json({ error: "Réservé aux créateurs et formateurs" }, { status: 403 });
  }
  if (!user.isVerified) {
    return NextResponse.json({ error: "Compte non vérifié" }, { status: 403 });
  }

  const { amount, phoneNumber, withdrawMode, countryCode } = await req.json();

  if (!amount || typeof amount !== "number") {
    return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
  }
  if (amount < MIN_WITHDRAWAL) {
    return NextResponse.json({
      error: `Minimum ${MIN_WITHDRAWAL.toLocaleString("fr-FR")} FCFA`,
    }, { status: 400 });
  }
  if (!phoneNumber?.trim()) {
    return NextResponse.json({ error: "Numéro Mobile Money requis" }, { status: 400 });
  }
  if (!withdrawMode) {
    return NextResponse.json({ error: "Opérateur requis" }, { status: 400 });
  }

  const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
  if (!wallet || wallet.balance < amount) {
    return NextResponse.json({ error: "Solde insuffisant" }, { status: 400 });
  }

  const fee         = Math.round(amount * MF_FEE_RATE);
  const net         = amount - fee;
  const isAutomatic = amount < AUTO_THRESHOLD;

  const withdrawal = await prisma.$transaction(async (tx) => {
    const w = await tx.withdrawal.create({
      data: {
        walletId:    wallet.id,
        amount,
        fee,
        net,
        status:      isAutomatic ? "PROCESSING" : "PENDING",
        method:      "MOBILE_MONEY" as any,
        phoneNumber: phoneNumber.trim(),
      },
    });

    await tx.wallet.update({
      where: { id: wallet.id },
      data:  { balance: { decrement: amount }, pending: { increment: amount } },
    });

    await tx.walletTransaction.create({
      data: {
        walletId:    wallet.id,
        amount:      -amount,
        type:        "WITHDRAWAL",
        status:      "PENDING",
        description: `Retrait ${withdrawMode} — ${phoneNumber.trim()}`,
      },
    });

    if (!isAutomatic) {
      const admins = await tx.user.findMany({
        where:  { role: "ADMIN" },
        select: { id: true },
      });
      for (const admin of admins) {
        await tx.notification.create({
          data: {
            id:         crypto.randomUUID(),
            type:       "MENTION" as any,
            receiverId: admin.id,
            senderId:   user.id,
            isRead:     false,
          } as any,
        });
      }
    }

    return w;
  });

  // Traitement automatique via Railway (IP fixe requis par MoneyFusion)
  if (isAutomatic) {
    try {
      const res = await fetch(`${RAILWAY_URL}/payments/moneyfusion/payout`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          amount:      net,
          phoneNumber: phoneNumber.trim(),
          withdrawMode,
          countryCode: countryCode ?? "ci",
          webhookUrl:  `${APP_URL}/api/webhooks/moneyfusion-payout`,
        }),
      });

      const data = await res.json();

      if (data.statut) {
        await prisma.withdrawal.update({
          where: { id: withdrawal.id },
          data:  { reference: data.tokenPay },
        });

        return NextResponse.json({
          id: withdrawal.id,
          amount, fee, net,
          status:    "PROCESSING",
          automatic: true,
          message:   "Retrait en cours de traitement.",
        }, { status: 201 });
      } else {
        throw new Error(data.message || "Erreur payout MoneyFusion");
      }

    } catch (err: any) {
      console.error("[Withdraw Auto] Erreur:", err.message);
      // Fallback → validation manuelle
      await prisma.withdrawal.update({
        where: { id: withdrawal.id },
        data:  { status: "PENDING" },
      });
    }
  }

  return NextResponse.json({
    id: withdrawal.id,
    amount, fee, net,
    status:    "PENDING",
    automatic: false,
    message:   amount >= AUTO_THRESHOLD
      ? `Retrait soumis à validation (≥ ${AUTO_THRESHOLD.toLocaleString("fr-FR")} FCFA). Traitement sous 24-48h.`
      : "Retrait soumis. Traitement en cours.",
  }, { status: 201 });
}
