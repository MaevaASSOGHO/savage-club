// app/api/conversations/route.ts
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

// GET /api/conversations — liste toutes les conversations de l'utilisateur
// Une seule query optimisée avec lastMessage + unreadCount
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type   = searchParams.get("type");   // SAVAGE | VIP | CUSTOM_CONTENT | DIRECT | null = tous
  const cursor = searchParams.get("cursor");
  const limit  = 20;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  // Trouver les conversations où l'utilisateur participe
  const participations = await prisma.conversationParticipant.findMany({
    where: {
      userId: user.id,
      Conversation: type ? { type: type as any } : undefined,
    },
    orderBy: { Conversation: { lastMessageAt: "desc" } },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      unreadCount: true,
      Conversation: {
        select: {
          id: true,
          type: true,
          lastMessageAt: true,
          // Dernier message
          Message: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              content: true,
              mediaType: true,
              createdAt: true,
              senderId: true,
              iv: true,
              User: { select: { id: true, username: true, displayName: true, avatar: true } },
            },
          },
          // Autres participants (l'interlocuteur)
          ConversationParticipant: {
            where: { userId: { not: user.id } },
            select: {
              User: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatar: true,
                  isVerified: true,
                  role: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const hasMore = participations.length > limit;
  const items   = hasMore ? participations.slice(0, limit) : participations;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  // Formater la réponse — déchiffrer le preview du dernier message
  const Conversations = items.map((p) => {
    const raw = p.Conversation.Message[0] ?? null;
    let lastMessage = raw;

    if (raw?.content && (raw as any).iv) {
      try {
        const { decryptMessage } = require("@/lib/encryption");
        const dec = decryptMessage({ content: raw.content, mediaUrl: null, iv: (raw as any).iv });
        lastMessage = { ...raw, content: dec.content };
      } catch {
        // Si le déchiffrement échoue → afficher générique
        lastMessage = { ...raw, content: "" };
      }
    }

    return {
      id: p.Conversation.id,
      type: p.Conversation.type,
      lastMessageAt: p.Conversation.lastMessageAt,
      unreadCount: p.unreadCount,
      lastMessage,
      other: p.Conversation.ConversationParticipant[0]?.User ?? null,
    };
  });

  return NextResponse.json({ 
  conversations: Conversations,  // 👈 minuscule pour cohérence
  nextCursor, 
  hasMore 
});
}

// POST /api/conversations — créer ou trouver une conversation existante
// Body: { recipientId, type?, firstMessage? }
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const body = await req.json();
  const { recipientId, type = "DIRECT", firstMessage } = body;

  if (!recipientId) {
    return NextResponse.json({ error: "recipientId requis" }, { status: 400 });
  }

  const sender = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!sender) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (sender.id === recipientId) {
    return NextResponse.json({ error: "Impossible de vous écrire à vous-même" }, { status: 400 });
  }

  // Vérifier si une conversation de ce type existe déjà entre ces deux utilisateurs
  const existing = await prisma.conversation.findFirst({
    where: {
      type,
      ConversationParticipant: {
        every: {
          userId: { in: [sender.id, recipientId] },
        },
      },
      AND: [
        { ConversationParticipant: { some: { userId: sender.id } } },
        { ConversationParticipant: { some: { userId: recipientId } } },
      ],
    },
    select: { id: true },
  });

  if (existing) {
    // Retourner la conversation existante
    return NextResponse.json({ ConversationId: existing.id, isNew: false });
  }

  // Déterminer le type de conversation selon l'abonnement
  let convType = type;
  if (convType === "DIRECT") {
    const sub = await prisma.subscription.findFirst({
      where: { subscriberId: sender.id, creatorId: recipientId, status: "ACTIVE" },
      select: { tier: true },
    });
    if (sub?.tier === "VIP")    convType = "VIP";
    else if (sub?.tier === "SAVAGE") convType = "SAVAGE";
  }

  // Créer la conversation + participants + premier message en transaction
  const result = await prisma.$transaction(async (tx) => {
    const conversation = await tx.conversation.create({
      data: {
        id: crypto.randomUUID(),
        type: convType as any,
        updatedAt: new Date(),
        ConversationParticipant: {
          create: [
            { id: crypto.randomUUID(), userId: sender.id },
            { id: crypto.randomUUID(),   userId: recipientId, unreadCount: firstMessage ? 1 : 0 },
          ],
        },
      },
    });

    let message = null;
    if (firstMessage?.trim()) {
      message = await tx.message.create({
        data: {
          id: crypto.randomUUID(),
          content: firstMessage,
          mediaType: "TEXT",
          createdAt: new Date(),
          conversationId: conversation.id,
          senderId: sender.id,
        },
      });

      await tx.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      });

      // Notification au destinataire
      await tx.notification.create({
        data: {
          id: crypto.randomUUID(),
          type: "MESSAGE",
          receiverId: recipientId,
          senderId: sender.id,
        },
      });
    }

    return { conversationId: conversation.id, isNew: true, message };
  });

  return NextResponse.json(result, { status: 201 });
}
