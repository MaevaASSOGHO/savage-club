import { getServerSession, authOptions } from "@/lib/auth-compat";
// app/api/conversations/[id]/messages/route.ts
import { prisma } from "@/lib/prisma";


import { NextResponse } from "next/server";
import { encryptMessage, decryptMessage } from "@/lib/encryption";

// ── GET — messages paginés avec déchiffrement ─────────────────────────────
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limit  = 30;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const participation = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId: user.id } },
  });
  if (!participation) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  // Vérifier expiration
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { expiresAt: true },
  });
  if (conversation?.expiresAt && conversation.expiresAt < new Date()) {
    return NextResponse.json({ error: "Conversation expirée", expired: true }, { status: 410 });
  }

  const rawMessages = await prisma.message.findMany({
    where: {
      conversationId,
      deletedForEveryone: false,
      NOT: { AND: [{ deletedForSender: true }, { senderId: user.id }] },
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true, content: true, mediaUrl: true, mediaType: true,
      iv: true, price: true, isUnlocked: true,
      deletedForSender: true, deletedForEveryone: true,
      createdAt: true, senderId: true,
      User: { select: { id: true, username: true, displayName: true, avatar: true } },
    },
  });

  const hasMore    = rawMessages.length > limit;
  const items      = hasMore ? rawMessages.slice(0, limit) : rawMessages;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  // Déchiffrer + masquer contenu payant
  const messages = items.reverse().map((msg) => {
    const isPaidLocked = msg.price && msg.price > 0 && !msg.isUnlocked && msg.senderId !== user.id;
    if (isPaidLocked) {
      return { ...msg, content: "", mediaUrl: null, iv: null, locked: true };
    }
    const dec = decryptMessage({ content: msg.content, mediaUrl: msg.mediaUrl, iv: msg.iv });
    return { ...msg, ...dec, locked: false };
  });

  // Reset unread
  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId, userId: user.id } },
    data: { unreadCount: 0, lastReadAt: new Date() },
  });

  return NextResponse.json({ messages, nextCursor, hasMore });
}

// ── POST — envoyer un message chiffré ─────────────────────────────────────
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const body = await req.json();
  const { content, mediaUrl, mediaType = "TEXT", price } = body;

  if (!content?.trim() && !mediaUrl) {
    return NextResponse.json({ error: "Message vide" }, { status: 400 });
  }

  const sender = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!sender) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const participation = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId: sender.id } },
  });
  if (!participation) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { expiresAt: true },
  });
  if (conversation?.expiresAt && conversation.expiresAt < new Date()) {
    return NextResponse.json({ error: "Conversation expirée" }, { status: 410 });
  }

  // Chiffrer
  const encrypted = encryptMessage(content || "", mediaUrl);
  const parsedPrice = price ? parseInt(String(price)) : null;

  const result = await prisma.$transaction(async (tx) => {
    const message = await tx.message.create({
      data: {
        id:             crypto.randomUUID(),
        content:        encrypted.content,
        mediaUrl:       encrypted.mediaUrl ?? null,
        mediaType,
        iv:             encrypted.iv ?? null,
        price:          parsedPrice ?? null,
        isUnlocked:     !parsedPrice,
        conversationId,
        senderId:       sender.id,  // ← scalaire direct
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
      data: { lastMessageAt: new Date() },
    });

    await tx.conversationParticipant.updateMany({
      where: { conversationId, userId: { not: sender.id } },
      data: { unreadCount: { increment: 1 } },
    });

    const others = await tx.conversationParticipant.findMany({
      where: { conversationId, userId: { not: sender.id } },
      select: { userId: true },
    });
    for (const other of others) {
      await tx.notification.create({
        data: { id: crypto.randomUUID(), type: "MESSAGE", receiverId: other.userId, senderId: sender.id },
      });
    }

    return message;
  });

  const dec = decryptMessage({ content: result.content, mediaUrl: result.mediaUrl, iv: result.iv });
  return NextResponse.json({ ...result, ...dec, locked: false }, { status: 201 });
}
