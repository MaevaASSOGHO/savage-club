// app/api/onboarding/progress/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-compat";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { step } = await req.json();
  if (typeof step !== "number") return NextResponse.json({ error: "step requis" }, { status: 400 });

  await prisma.user.update({
    where: { id: session.user.id },
    data:  { onboardingStep: step },
  });

  return NextResponse.json({ ok: true, step });
}
