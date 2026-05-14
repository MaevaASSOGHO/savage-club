// app/api/onboarding/categories/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-compat";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { categories } = await req.json();
  if (!Array.isArray(categories)) return NextResponse.json({ error: "categories requis" }, { status: 400 });

  await prisma.user.update({
    where: { id: session.user.id },
    data:  { interests: categories },
  });

  return NextResponse.json({ ok: true });
}
