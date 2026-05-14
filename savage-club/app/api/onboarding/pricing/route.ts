// app/api/onboarding/pricing/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-compat";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { subscriptionPrice } = await req.json();
  if (!subscriptionPrice || subscriptionPrice < 500)
    return NextResponse.json({ error: "Prix invalide" }, { status: 400 });

  await prisma.user.update({
    where: { id: session.user.id },
    data:  { subscriptionPrice },
  });

  return NextResponse.json({ ok: true });
}
