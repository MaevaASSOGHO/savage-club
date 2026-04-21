// app/api/payments/route.ts
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

// ── GET /api/payments ─────────────────────────────────────────────────────
// Retourne l'historique des paiements de l'utilisateur connecté
// Query params:
//   ?type=sent|received   (défaut: sent)
//   ?limit=20             (défaut: 20)
//   ?cursor=<paymentId>   (pagination curseur)
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type   = searchParams.get("type") ?? "sent";
  const limit  = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
  const cursor = searchParams.get("cursor");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const where = type === "received"
    ? { recipientId: user.id }
    : { payerId: user.id };

  const payments = await prisma.payment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      amount: true,
      status: true,
      type: true,
      description: true,
      createdAt: true,
      User_Payment_payerIdToUser: { select: { id: true, username: true, displayName: true, avatar: true } },
      User_Payment_recipientIdToUser: { select: { id: true, username: true, displayName: true, avatar: true } },
      Subscription: { select: { tier: true } },
    },
  });

  const hasMore = payments.length > limit;
  const items   = hasMore ? payments.slice(0, limit) : payments;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({ payments: items, nextCursor, hasMore });
}

// ── POST /api/payments ────────────────────────────────────────────────────
// Enregistre un paiement one-shot (message, appel audio/vidéo, contenu perso)
// Body: { recipientId, amount, type, description?, reference? }
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const body = await req.json();
  const { recipientId, amount, type, description, reference } = body;

  const validTypes = ["MESSAGE", "AUDIO_CALL", "VIDEO_CALL", "CUSTOM_CONTENT"];
  if (!recipientId || !validTypes.includes(type)) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }
  if (typeof amount !== "number" || amount < 0) {
    return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
  }

  const payer = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!payer) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  if (payer.id === recipientId) {
    return NextResponse.json({ error: "Impossible de se payer soi-même" }, { status: 400 });
  }

  const payment = await prisma.payment.create({
    data: {
      id: crypto.randomUUID(),
      amount,
      status: "SUCCESS",
      type,
      description: description ?? null,
      reference: reference ?? null,
      payerId: payer.id,
      recipientId,
    },
    select: {
      id: true,
      amount: true,
      status: true,
      type: true,
      description: true,
      createdAt: true,
    },
  });

  return NextResponse.json(payment, { status: 201 });
}
