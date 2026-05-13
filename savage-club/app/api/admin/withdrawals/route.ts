// app/api/admin/withdrawals/route.ts
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

  const withdrawals = await prisma.withdrawal.findMany({
    where:   { status: { in: ["PENDING", "PROCESSING"] } },
    orderBy: { createdAt: "asc" },
    include: {
      Wallet: {
        include: {
          User: {
            select: { id: true, username: true, displayName: true, email: true, avatar: true },
          },
          WalletTransaction: {
            where:   {
              type:   { in: ["SUBSCRIPTION_EARNING", "PPV_EARNING", "BOOKING_EARNING", "TIP_EARNING"] },
              status: "COMPLETED",
            },
            orderBy: { createdAt: "desc" },
            take:    5,
            select:  { id: true, amount: true, type: true, createdAt: true },
          },
        },
      },
    },
  });

  return NextResponse.json(withdrawals.map((w) => ({
    id:             w.id,
    amount:         w.amount,
    fee:            w.fee,
    net:            w.net,
    status:         w.status,
    phoneNumber:    w.phoneNumber,
    withdrawMode:   w.reference,
    createdAt:      w.createdAt,
    walletBalance:  w.Wallet.balance,
    totalEarned:    w.Wallet.totalEarned,
    totalWithdrawn: w.Wallet.totalWithdrawn,
    recentPayments: w.Wallet.WalletTransaction.map((t) => ({
      id:        t.id,
      amount:    t.amount,
      type:      t.type,
      createdAt: t.createdAt,
    })),
    user: w.Wallet.User,
  })));
}

export async function PATCH(req: Request) {
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

  const { withdrawalId, action, reason, message } = await req.json();

  const withdrawal = await prisma.withdrawal.findUnique({
    where:   { id: withdrawalId },
    include: { Wallet: { include: { User: { select: { id: true, username: true } } } } },
  });
  if (!withdrawal) {
    return NextResponse.json({ error: "Retrait introuvable" }, { status: 404 });
  }

  const creatorId = withdrawal.Wallet.User.id;

  if (action === "approve") {
    await prisma.$transaction(async (tx) => {
      await tx.withdrawal.update({
        where: { id: withdrawalId },
        data:  { status: "COMPLETED", processedAt: new Date() },
      });
      await tx.wallet.update({
        where: { id: withdrawal.walletId },
        data: {
          pending:        { decrement: withdrawal.amount },
          totalWithdrawn: { increment: withdrawal.amount },
        },
      });
      await tx.walletTransaction.updateMany({
        where: { walletId: withdrawal.walletId, type: "WITHDRAWAL", status: "PENDING" },
        data:  { status: "COMPLETED" },
      });
    });

    // Notification in-app validation
    const systemUser = await prisma.user.findFirst({
      where:  { email: "system@savage-club.app" },
      select: { id: true },
    });
    if (systemUser) {
      await prisma.notification.create({
        data: {
          id:         crypto.randomUUID(),
          type:       "MENTION" as any,
          receiverId: creatorId,
          senderId:   systemUser.id,
          isRead:     false,
        } as any,
      });
    }

  } else if (action === "reject") {
    // Récupérer le compte système
    const systemUser = await prisma.user.findFirst({
      where:  { email: "system@savage-club.app" },
      select: { id: true },
    });

    await prisma.$transaction(async (tx) => {
      // 1. Mettre à jour le retrait
      await tx.withdrawal.update({
        where: { id: withdrawalId },
        data:  { status: "REJECTED", processedAt: new Date() },
      });

      // 2. Rembourser le solde
      await tx.wallet.update({
        where: { id: withdrawal.walletId },
        data: {
          balance: { increment: withdrawal.amount },
          pending: { decrement: withdrawal.amount },
        },
      });

      await tx.walletTransaction.updateMany({
        where: { walletId: withdrawal.walletId, type: "WITHDRAWAL", status: "PENDING" },
        data:  { status: "FAILED" },
      });

      if (!systemUser) return;

      // 3. Trouver ou créer une conversation DIRECT entre système et créateur
      const existing = await tx.conversation.findFirst({
        where: {
          type: "DIRECT",
          AND: [
            { ConversationParticipant: { some: { userId: systemUser.id } } },
            { ConversationParticipant: { some: { userId: creatorId } } },
          ],
        },
        select: { id: true },
      });

      let conversationId = existing?.id;

      if (!conversationId) {
        const conv = await tx.conversation.create({
          data: {
            id:        crypto.randomUUID(),
            type:      "DIRECT",
            updatedAt: new Date(),
            ConversationParticipant: {
              create: [
                { id: crypto.randomUUID(), userId: systemUser.id },
                { id: crypto.randomUUID(), userId: creatorId, unreadCount: 1 },
              ],
            },
          },
        });
        conversationId = conv.id;
      } else {
        // Incrémenter unreadCount du créateur
        await tx.conversationParticipant.updateMany({
          where: { conversationId, userId: creatorId },
          data:  { unreadCount: { increment: 1 } },
        });
      }

      // 4. Composer le message de rejet
      const fullMessage = [
        `❌ Votre demande de retrait de ${withdrawal.amount.toLocaleString("fr-FR")} FCFA a été refusée.`,
        `\n📋 Raison : ${reason}`,
        message?.trim() ? `\n\n💬 ${message.trim()}` : "",
        `\n\nVotre solde de ${withdrawal.amount.toLocaleString("fr-FR")} pts a été recrédité. Si vous avez des questions, répondez à ce message.`,
      ].join("");

      await tx.message.create({
        data: {
          id:             crypto.randomUUID(),
          content:        fullMessage,
          mediaType:      "TEXT",
          createdAt:      new Date(),
          conversationId,
          senderId:       systemUser.id,
        },
      });

      await tx.conversation.update({
        where: { id: conversationId },
        data:  { lastMessageAt: new Date() },
      });

      // 5. Notification in-app
      await tx.notification.create({
        data: {
          id:         crypto.randomUUID(),
          type:       "MESSAGE" as any,
          receiverId: creatorId,
          senderId:   systemUser.id,
          isRead:     false,
        } as any,
      });
    });
  }

  return NextResponse.json({ success: true });
}
