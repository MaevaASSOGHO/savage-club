// app/api/subscriptions/route.ts
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

// GET /api/subscriptions?creatorId=xxx
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ tier: null, sub: null });

  const { searchParams } = new URL(req.url);
  const creatorId = searchParams.get("creatorId");
  if (!creatorId) return NextResponse.json({ error: "creatorId requis" }, { status: 400 });

  const viewer = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!viewer) return NextResponse.json({ tier: null, sub: null });

  const sub = await prisma.subscription.findFirst({
    where: { subscriberId: viewer.id, creatorId, status: "ACTIVE" },
    select: { id: true, tier: true, status: true, startedAt: true, renewsAt: true },
  });

  return NextResponse.json({ tier: sub?.tier ?? null, sub });
}

// POST /api/subscriptions
// Body: { creatorId, tier: "FREE" | "SAVAGE" | "VIP", amount: number, reference?: string }
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const body = await req.json();
  const { creatorId, tier, amount, reference } = body;

  const validTiers = ["FREE", "SAVAGE", "VIP"];
  if (!creatorId || !validTiers.includes(tier)) 
    {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  const viewer = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!viewer) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  if (viewer.id === creatorId) {
    return NextResponse.json({ error: "Impossible de s'abonner à soi-même" }, { status: 400 });
  }
  await prisma.follow.upsert({
    where: {
      followerId_followingId: { followerId: viewer.id, followingId: creatorId },
    },
    update: {},
    create: {
      id:          crypto.randomUUID(),
      followerId:  viewer.id,
      followingId: creatorId,
    },
  });
  const renewsAt = tier === "FREE" ? null : (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d;
  })();

  const [sub, payment] = await prisma.$transaction(async (tx) => {
    const sub = await tx.subscription.upsert({
      where: { subscriberId_creatorId: { subscriberId: viewer.id, creatorId } },
      update: { tier, status: "ACTIVE", startedAt: new Date(), renewsAt, cancelledAt: null, updatedAt: new Date() },
      create: { id: crypto.randomUUID(), subscriberId: viewer.id, creatorId, tier, status: "ACTIVE", renewsAt, updatedAt: new Date() },
    });

    // Enregistrer un paiement seulement pour les tiers payants
    if (tier !== "FREE" && typeof amount === "number") {
      const tierLabel = tier === "VIP" ? "Savage VIP" : "Savage";
      const month = new Date().toLocaleString("fr-FR", { month: "long", year: "numeric" });
      const payment = await tx.payment.create({
        data: {
          id: crypto.randomUUID(),
          amount,
          status: "SUCCESS",
          type: "SUBSCRIPTION",
          description: `Abonnement ${tierLabel} — ${month}`,
          reference: reference ?? null,
          payerId: viewer.id,
          recipientId: creatorId,
          subscriptionId: sub.id,
        },
      });
      return [sub, payment];
    }

    return [sub, null];
  });

  return NextResponse.json({ sub, payment }, { status: 201 });
}

// DELETE /api/subscriptions?creatorId=xxx
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const creatorId = searchParams.get("creatorId");
  if (!creatorId) return NextResponse.json({ error: "creatorId requis" }, { status: 400 });

  const viewer = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!viewer) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  await prisma.subscription.updateMany({
    where: { subscriberId: viewer.id, creatorId, status: "ACTIVE" },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });
  await prisma.follow.deleteMany({
    where: {
      followerId: viewer.id,
      followingId: creatorId,
    },
  });
  return NextResponse.json({ success: true });
}
