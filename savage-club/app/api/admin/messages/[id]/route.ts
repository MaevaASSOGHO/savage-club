// app/api/admin/messages/[id]/route.ts
import { getServerSession, authOptions } from "@/lib/auth-compat";
import { prisma }                        from "@/lib/prisma";
import { NextResponse }                  from "next/server";
import { encryptMessage, decryptMessage } from "@/lib/encryption";

// GET — lire les messages d'une conversation système
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const admin = await prisma.user.findUnique({
    where:  { email: session.user.email },
    select: { role: true },
  });
  if (admin?.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const systemUser = await prisma.user.findFirst({
    where:  { email: "system@savage-club.app" },
    select: { id: true },
  });
  if (!systemUser) return NextResponse.json({ messages: [] });

  const rawMessages = await prisma.message.findMany({
    where:   { conversationId, deletedForEveryone: false },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, content: true, mediaUrl: true, mediaType: true,
      iv: true, price: true, isUnlocked: true,
      createdAt: true, senderId: true,
      User: { select: { id: true, username: true, displayName: true, avatar: true } },
    },
  });

  const messages = rawMessages.map((msg) => {
    try {
      const dec = decryptMessage({ content: msg.content, mediaUrl: msg.mediaUrl, iv: msg.iv });
      return { ...msg, ...dec, locked: false };
    } catch {
      return { ...msg, locked: false };
    }
  });

  return NextResponse.json(messages);
}

// POST — envoyer un message en tant que compte système
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const admin = await prisma.user.findUnique({
    where:  { email: session.user.email },
    select: { role: true },
  });
  if (admin?.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { content } = await req.json();
  if (!content?.trim()) {
    return NextResponse.json({ error: "Message vide" }, { status: 400 });
  }

  const systemUser = await prisma.user.findFirst({
    where:  { email: "system@savage-club.app" },
    select: { id: true },
  });
  if (!systemUser) {
    return NextResponse.json({ error: "Compte système introuvable" }, { status: 500 });
  }

  const participation = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId: systemUser.id } },
  });
  if (!participation) {
    return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
  }

  const encrypted = encryptMessage(content.trim(), null);

  const message = await prisma.$transaction(async (tx) => {
    const msg = await tx.message.create({
      data: {
        id:             crypto.randomUUID(),
        content:        encrypted.content,
        mediaType:      "TEXT",
        iv:             encrypted.iv ?? null,
        isUnlocked:     true,
        createdAt:      new Date(),
        conversationId,
        senderId:       systemUser.id,
      },
      select: {
        id: true, content: true, mediaUrl: true, mediaType: true,
        iv: true, price: true, isUnlocked: true,
        createdAt: true, senderId: true,
        User: { select: { id: true, username: true, displayName: true, avatar: true } },
      },
    });

    await tx.conversation.update({
      where: { id: conversationId },
      data:  { lastMessageAt: new Date() },
    });

    await tx.conversationParticipant.updateMany({
      where: { conversationId, userId: { not: systemUser.id } },
      data:  { unreadCount: { increment: 1 } },
    });

    const other = await tx.conversationParticipant.findFirst({
      where:  { conversationId, userId: { not: systemUser.id } },
      select: { userId: true },
    });
    if (other) {
      await tx.notification.create({
        data: {
          id:         crypto.randomUUID(),
          type:       "MESSAGE" as any,
          receiverId: other.userId,
          senderId:   systemUser.id,
          isRead:     false,
        } as any,
      });
    }

    return msg;
  });

  return NextResponse.json({
    ...message,
    content: content.trim(),
    locked:  false,
  }, { status: 201 });
}
