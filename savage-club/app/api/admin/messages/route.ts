// app/api/admin/messages/route.ts
import { getServerSession, authOptions } from "@/lib/auth-compat";
import { prisma }                        from "@/lib/prisma";
import { NextResponse }                  from "next/server";

export async function GET() {
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

  // Récupérer les conversations du compte système
  const systemUser = await prisma.user.findFirst({
    where:  { email: "system@savage-club.app" },
    select: { id: true },
  });
  if (!systemUser) return NextResponse.json({ conversations: [] });

  const participations = await prisma.conversationParticipant.findMany({
    where:   { userId: systemUser.id },
    orderBy: { Conversation: { lastMessageAt: "desc" } },
    include: {
      Conversation: {
        include: {
          Message: {
            orderBy: { createdAt: "desc" },
            take:    1,
            select:  { id: true, content: true, createdAt: true, senderId: true },
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

  const conversations = participations.map((p) => {
    const other       = p.Conversation.ConversationParticipant[0];
    const lastMessage = p.Conversation.Message[0] ?? null;
    return {
      id:            p.Conversation.id,
      lastMessageAt: p.Conversation.lastMessageAt,
      unreadCount:   other?.unreadCount ?? 0,
      lastMessage:   lastMessage ? { content: lastMessage.content ?? "" } : null,
      other:         other?.User ?? null,
    };
  });

  return NextResponse.json({ conversations });
}
