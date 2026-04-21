// app/api/notifications/route.ts
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Correction du type : content peut être null
type NotificationWithSender = {
  id: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
  postId: string | null;
  receiverId: string;
  senderId: string | null;
  sender: {
    username: string;
    avatar: string | null;
  } | null;
  post: {
    id: string;
    content: string | null;  // ← ICI : content peut être null
    PostMedia: { url: string; type: string }[];
  } | null;
};

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limit = 20;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) return NextResponse.json({ notifications: [], nextCursor: null, hasMore: false });

  // Récupérer les notifications brutes
  const notifications = await prisma.notification.findMany({
    where: { receiverId: user.id },
    include: {
      User_Notification_senderIdToUser: {
        select: { username: true, avatar: true },
      },
      Post: {
        select: {
          id: true,
          content: true,  // content peut être null
          PostMedia: {
            select: { url: true, type: true },
            take: 1
          }
        }
      }
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
  });

  // Regrouper les notifications similaires (comme Instagram)
  const mapped = notifications.map((n) => ({
    id:         n.id,
    type:       n.type,
    isRead:     n.isRead,
    createdAt:  n.createdAt,
    postId:     n.postId,
    receiverId: n.receiverId,
    senderId:   n.senderId,
    sender:     n.User_Notification_senderIdToUser,
    post:       n.Post,
  }));

  const groupedNotifications = groupNotifications(mapped);
  
  // Vérifier s'il y a une prochaine page
  let nextCursor = null;
  if (notifications.length > limit) {
    const nextItem = notifications[limit];
    nextCursor = nextItem?.id;
  }

  return NextResponse.json({
    notifications: groupedNotifications.slice(0, limit),
    nextCursor,
    hasMore: nextCursor !== null,
  });
}

function groupNotifications(notifications: NotificationWithSender[]): any[] {
  const groups: any[] = [];
  const processedIds = new Set<string>();

  for (let i = 0; i < notifications.length; i++) {
    const notif = notifications[i];
    if (processedIds.has(notif.id)) continue;
    
    // Grouper les LIKES par post
    if (notif.type === "LIKE" && notif.postId) {
      const similarLikes = notifications.filter(n => 
        n.type === "LIKE" && 
        n.postId === notif.postId &&
        !processedIds.has(n.id)
      );
      
      if (similarLikes.length > 1) {
        const uniqueUsers = new Map();
        similarLikes.forEach(n => {
          if (n.sender) {
            uniqueUsers.set(n.sender.username, n.sender);
          }
        });
        const uniqueSenders = Array.from(uniqueUsers.values());
        
        groups.push({
          ...notif,
          id: `group_like_${notif.postId}_${Date.now()}_${i}`,
          isGrouped: true,
          count: uniqueSenders.length,
          firstUsers: uniqueSenders.slice(0, 3).map((s: any) => s.username),
          type: "LIKE",
          aggregatedAt: similarLikes[0].createdAt,
          post: notif.post
        });
        
        similarLikes.forEach(n => processedIds.add(n.id));
        continue;
      }
    }
    
    // Grouper les COMMENTAIRES par post
    if (notif.type === "COMMENT" && notif.postId) {
      const similarComments = notifications.filter(n => 
        n.type === "COMMENT" && 
        n.postId === notif.postId &&
        !processedIds.has(n.id)
      );
      
      if (similarComments.length > 1) {
        const uniqueUsers = new Map();
        similarComments.forEach(n => {
          if (n.sender) {
            uniqueUsers.set(n.sender.username, n.sender);
          }
        });
        const uniqueSenders = Array.from(uniqueUsers.values());
        
        groups.push({
          ...notif,
          id: `group_comment_${notif.postId}_${Date.now()}_${i}`,
          isGrouped: true,
          count: uniqueSenders.length,
          firstUsers: uniqueSenders.slice(0, 3).map((s: any) => s.username),
          type: "COMMENT",
          aggregatedAt: similarComments[0].createdAt,
          post: notif.post
        });
        
        similarComments.forEach(n => processedIds.add(n.id));
        continue;
      }
    }
    
    // Pour les notifications uniques, les garder telles quelles
    groups.push(notif);
    processedIds.add(notif.id);
  }
  
  return groups;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const { type, postId, receiverId } = await req.json();

  const sender = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!sender || sender.id === receiverId) {
    return NextResponse.json({ ok: true });
  }

  const notification = await prisma.notification.create({
    data: {
      id:          crypto.randomUUID(),
      type,
      createdAt: new Date(),
      postId,
      receiverId,
      senderId: sender.id,
      isRead: false,
    },
  });

  return NextResponse.json(notification);
}