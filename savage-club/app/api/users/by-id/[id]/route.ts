// app/api/users/by-id/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatar: true,
      audioCallPrice: true,
      videoCallPrice: true,
      messagePrice: true,
    },
  });

  if (!user) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(user);
}
