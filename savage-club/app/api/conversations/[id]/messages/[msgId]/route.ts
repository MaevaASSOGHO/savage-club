// app/api/conversations/[id]/messages/[msgId]/route.ts
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

// DELETE /api/conversations/[id]/messages/[msgId]
// Body: { deleteFor: "me" | "everyone" }
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; msgId: string }> }
) {
  const { id: conversationId, msgId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const deleteFor = body.deleteFor ?? "me"; // "me" | "everyone"

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });
  if (!user) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const message = await prisma.message.findUnique({
    where: { id: msgId },
    select: { id: true, senderId: true, conversationId: true },
  });

  if (!message || message.conversationId !== conversationId) {
    return NextResponse.json({ error: "Message introuvable" }, { status: 404 });
  }

  // Supprimer pour tout le monde : seulement l'expéditeur ou un créateur/formateur
  if (deleteFor === "everyone") {
    const isCreator = user.role === "CREATOR" || user.role === "TRAINER";
    if (message.senderId !== user.id && !isCreator) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }
    await prisma.message.update({
      where: { id: msgId },
      data: { deletedForEveryone: true, content: "", mediaUrl: null },
    });
    return NextResponse.json({ deleted: "everyone" });
  }

  // Supprimer pour soi uniquement
  await prisma.message.update({
    where: { id: msgId },
    data: { deletedForSender: true },
  });
  return NextResponse.json({ deleted: "me" });
}
