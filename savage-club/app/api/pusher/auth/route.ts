import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-compat";
import { authOptions } from "@/lib/auth-compat";
import { getPusher } from "@/lib/pusher";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.text();
  const params = new URLSearchParams(body);
  const socketId = params.get("socket_id")!;
  const channel  = params.get("channel_name")!;

  // Vérifier que l'utilisateur ne s'abonne qu'à son propre channel
  if (channel !== `private-user-${user.id}`) {
    return NextResponse.json({ error: "Interdit" }, { status: 403 });
  }
  const pusherInstance = await getPusher();
  const authResponse = pusherInstance.authorizeChannel(socketId, channel);

  return NextResponse.json(authResponse);
}