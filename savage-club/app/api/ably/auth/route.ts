import { NextResponse } from "next/server";
import * as Ably from "ably";
import { getServerSession, authOptions } from "@/lib/auth-compat";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 401 });

  const client = new Ably.Rest(process.env.ABLY_API_KEY!);
  const tokenRequest = await client.auth.createTokenRequest({
    clientId: user.id,
    ttl: 3600 * 1000,
  });

  return NextResponse.json(tokenRequest);
}