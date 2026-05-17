// app/api/ably/auth/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-compat";
import { authOptions } from "@/lib/auth-compat";
import * as Ably from "ably";
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
  if (!user) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const client = new Ably.Rest(process.env.ABLY_API_KEY!);
  const tokenRequest = await client.auth.createTokenRequest({
    clientId: user.id,
    capability: {
      // L'utilisateur ne peut s'abonner qu'à son propre channel
      [`private-user-${user.id}`]: ["subscribe"],
    },
    ttl: 3600 * 1000, // token valide 1 heure (en ms)
  });

  return NextResponse.json(tokenRequest);
}