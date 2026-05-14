// app/api/onboarding/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-compat";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { displayName, bio, subject, avatar } = await req.json();

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(displayName ? { displayName }         : {}),
      ...(bio         ? { bio }                 : {}),
      ...(subject     ? { category: subject }   : {}),
      ...(avatar      ? { avatar }              : {}),
    },
  });

  return NextResponse.json({ ok: true });
}
