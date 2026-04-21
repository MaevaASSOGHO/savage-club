// app/api/users/[username]/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatar: true,
      messagePrice: true,
      audioCallPrice: true,
      videoCallPrice: true,
    },
  });

  if (!user) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(user);
}
