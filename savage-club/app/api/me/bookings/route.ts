import { getServerSession, authOptions } from "@/lib/auth-compat";
// app/api/me/bookings/route.ts
import { prisma } from "@/lib/prisma";


import { NextResponse } from "next/server";

// GET /api/me/bookings?as=requester|creator
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const as = searchParams.get("as") ?? "requester";

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const where = as === "creator"
    ? { creatorId: user.id }
    : { requesterId: user.id };

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: { scheduledAt: "asc" },
    include: {
      User_Booking_requesterIdToUser: {
        select: { id: true, username: true, displayName: true, avatar: true },
      },
      User_Booking_creatorIdToUser: {
        select: { id: true, username: true, displayName: true, avatar: true },
      },
    },
  });

  // ✅ FORMATAGE : Transformer les noms techniques en noms propres
  const formattedBookings = bookings.map((booking) => ({
    id: booking.id,
    type: booking.type,
    status: booking.status,
    scheduledAt: booking.scheduledAt,
    counterProposedAt: booking.counterProposedAt,
    counterRepliedAt: booking.counterRepliedAt,
    negotiationCount: booking.negotiationCount,
    duration: booking.duration,
    amount: booking.amount,
    note: booking.note,
    requester: {
      id: booking.User_Booking_requesterIdToUser.id,
      username: booking.User_Booking_requesterIdToUser.username,
      displayName: booking.User_Booking_requesterIdToUser.displayName,
      avatar: booking.User_Booking_requesterIdToUser.avatar,
    },
    creator: {
      id: booking.User_Booking_creatorIdToUser.id,
      username: booking.User_Booking_creatorIdToUser.username,
      displayName: booking.User_Booking_creatorIdToUser.displayName,
      avatar: booking.User_Booking_creatorIdToUser.avatar,
    },
  }));

  return NextResponse.json(formattedBookings);
}