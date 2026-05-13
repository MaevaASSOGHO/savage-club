// app/api/admin/messages/route.ts
import { getServerSession, authOptions } from "@/lib/auth-compat";
import { prisma }                        from "@/lib/prisma";
import { NextResponse }                  from "next/server";
import { decryptMessage }                from "@/lib/encryption";

const LIMIT = 15;

export async function GET(req: Request) {
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

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");

  const systemUser = await prisma.user.findFirst({
    where:  { email: "system@savage-club.app" },
    select: { id: true },
  });
  if (!systemUser) return NextResponse.json({ conversations: [], hasMore: false, nextCursor: null });

  const participations = await prisma.conversationParticipant.findMany({
    where:   { userId: systemUser.id },
    orderBy: { Conversation: { lastMessageAt: "desc" } },
    take:    LIMIT + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      Conversation: {
        include: {
          Message: {
            orderBy: { createdAt: "desc" },
            take:    1,
            select:  { id: true, content: true, iv: true, createdAt: true, senderId: true },
          },
          ConversationParticipant: {
            where:  { userId: { not: systemUser.id } },
            select: {
              unreadCount: true,
              User: { select: { id: true, username: true, displayName: true, avatar: true } },
            },
          },
        },
      },
    },
  });

  const hasMore    = participations.length > LIMIT;
  const items      = hasMore ? participations.slice(0, LIMIT) : participations;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  const conversations = items.map((p) => {
    const other  = p.Conversation.ConversationParticipant[0];
    const rawMsg = p.Conversation.Message[0] ?? null;

    let lastMessageContent = "";
    if (rawMsg?.content) {
      try {
        const dec = decryptMessage({ content: rawMsg.content, mediaUrl: null, iv: rawMsg.iv ?? null });
        lastMessageContent = dec.content ?? "";
      } catch {
        lastMessageContent = "Message";
      }
    }

    return {
      id:            p.Conversation.id,
      lastMessageAt: p.Conversation.lastMessageAt,
      unreadCount:   other?.unreadCount ?? 0,
      lastMessage:   rawMsg ? { content: lastMessageContent } : null,
      other:         other?.User ?? null,
    };
  });

  return NextResponse.json({ conversations, hasMore, nextCursor });
}
