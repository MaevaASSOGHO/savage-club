import { prisma }           from "@/lib/prisma";
import { NextResponse }     from "next/server";
import { getSessionUser }   from "@/lib/get-session-user";
import { getCached, setCached, invalidateCache } from "@/lib/cache";
import { captureApiError }  from "@/lib/sentry";
import type { SubscriptionTier } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const viewer = await getSessionUser();
    if (!viewer) return NextResponse.json({ tier: null, sub: null });

    const { searchParams } = new URL(req.url);
    const creatorId = searchParams.get("creatorId");
    if (!creatorId) return NextResponse.json({ error: "creatorId requis" }, { status: 400 });

    const cacheKey = `sub:${viewer.id}:${creatorId}`;
    const cached   = await getCached<{ tier: string | null; sub: object | null }>(cacheKey);
    if (cached) return NextResponse.json(cached);

    const sub = await prisma.subscription.findFirst({
      where:  { subscriberId: viewer.id, creatorId, status: "ACTIVE" },
      select: { id: true, tier: true, status: true, startedAt: true, renewsAt: true },
    });

    const result = { tier: sub?.tier ?? null, sub };
    await setCached(cacheKey, result, "subscription");

    return NextResponse.json(result);
  } catch (err) {
    return captureApiError(err, { route: "subscriptions/GET" });
  }
}

export async function POST(req: Request) {
  let creatorId: string | undefined;
  let tier: string | undefined;

  try {
    const viewer = await getSessionUser();
    if (!viewer) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

    const body = await req.json();
    ({ creatorId, tier } = body);
    const { amount, reference } = body;

    const validTiers: SubscriptionTier[] = ["FREE", "SAVAGE", "VIP"];
    if (!creatorId || !validTiers.includes(tier as SubscriptionTier)) {
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }

    if (viewer.id === creatorId) {
      return NextResponse.json({ error: "Impossible de s'abonner à soi-même" }, { status: 400 });
    }

    await prisma.follow.upsert({
      where:  { followerId_followingId: { followerId: viewer.id, followingId: creatorId } },
      update: {},
      create: { id: crypto.randomUUID(), followerId: viewer.id, followingId: creatorId },
    });

    const renewsAt = tier === "FREE" ? null : (() => {
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      return d;
    })();

    const [sub, payment] = await prisma.$transaction(async (tx) => {
      const sub = await tx.subscription.upsert({
        where:  { subscriberId_creatorId: { subscriberId: viewer.id, creatorId: creatorId! } },
        update: { tier: tier as SubscriptionTier, status: "ACTIVE", startedAt: new Date(), renewsAt, cancelledAt: null, updatedAt: new Date() },
        create: { id: crypto.randomUUID(), subscriberId: viewer.id, creatorId: creatorId!, tier: tier as SubscriptionTier, status: "ACTIVE", renewsAt, updatedAt: new Date() },
      });

      if (tier !== "FREE" && typeof amount === "number") {
        const tierLabel = tier === "VIP" ? "Savage VIP" : "Savage";
        const month     = new Date().toLocaleString("fr-FR", { month: "long", year: "numeric" });
        const payment   = await tx.payment.create({
          data: {
            id: crypto.randomUUID(), amount, status: "SUCCESS", type: "SUBSCRIPTION",
            description: `Abonnement ${tierLabel} — ${month}`,
            reference: reference ?? null,
            payerId: viewer.id, recipientId: creatorId!, subscriptionId: sub.id,
          },
        });
        return [sub, payment];
      }
      return [sub, null];
    });

    await invalidateCache(`sub:${viewer.id}:${creatorId}`);

    return NextResponse.json({ sub, payment }, { status: 201 });
  } catch (err) {
    return captureApiError(err, { route: "subscriptions/POST", creatorId, tier });
  }
}

export async function DELETE(req: Request) {
  let creatorId: string | null = null;

  try {
    const viewer = await getSessionUser();
    if (!viewer) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    creatorId = searchParams.get("creatorId");
    if (!creatorId) return NextResponse.json({ error: "creatorId requis" }, { status: 400 });

    await prisma.subscription.updateMany({
      where: { subscriberId: viewer.id, creatorId, status: "ACTIVE" },
      data:  { status: "CANCELLED", cancelledAt: new Date() },
    });

    await prisma.follow.deleteMany({
      where: { followerId: viewer.id, followingId: creatorId },
    });

    await invalidateCache(`sub:${viewer.id}:${creatorId}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    return captureApiError(err, { route: "subscriptions/DELETE", creatorId });
  }
}