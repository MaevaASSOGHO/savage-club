// app/api/conversations/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

// PATCH /api/conversations/[id] — modifier TTL
// Body: { ttl: "1h" | "24h" | "3d" | "7d" | null }
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const body = await req.json();
  const { ttl } = body; // "1h" | "24h" | "3d" | "7d" | null

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });
  if (!user) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  // Seul un créateur/formateur peut définir le TTL
  if (user.role !== "CREATOR" && user.role !== "TRAINER") {
    return NextResponse.json({ error: "Réservé aux créateurs" }, { status: 403 });
  }

  const participation = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId: user.id } },
  });
  if (!participation) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  // Calculer la date d'expiration
  const TTL_MAP: Record<string, number> = {
    "1h":  1 * 60 * 60 * 1000,
    "24h": 24 * 60 * 60 * 1000,
    "3d":  3 * 24 * 60 * 60 * 1000,
    "7d":  7 * 24 * 60 * 60 * 1000,
  };

  const expiresAt = ttl && TTL_MAP[ttl]
    ? new Date(Date.now() + TTL_MAP[ttl])
    : null;

  const updated = await prisma.conversation.update({
    where: { id },
    data: { expiresAt },
    select: { id: true, expiresAt: true },
  });

  return NextResponse.json(updated);
}

// DELETE /api/conversations/[id] — supprimer conversation
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });
  if (!user) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const participation = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId: user.id } },
  });
  if (!participation) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const isCreator = user.role === "CREATOR" || user.role === "TRAINER";

  if (isCreator) {
    // Créateur : supprimer la conversation entière (cascade supprime messages + participants)
    await prisma.conversation.delete({ where: { id } });
    return NextResponse.json({ deleted: "conversation" });
  } else {
    // Membre : juste se retirer de la conversation
    await prisma.conversationParticipant.delete({
      where: { conversationId_userId: { conversationId: id, userId: user.id } },
    });
    return NextResponse.json({ deleted: "participation" });
  }
}
