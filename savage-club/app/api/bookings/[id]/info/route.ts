// app/api/bookings/[id]/info/route.ts
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export async function GET(
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
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const booking = await prisma.booking.findUnique({
    where: { id },
    select: {
      id: true,
      type: true,
      status: true,
      scheduledAt: true,
      duration: true,
      creatorId: true,
      requesterId: true,
      User_Booking_creatorIdToUser: {
        select: { id: true, username: true, displayName: true, avatar: true },
      },
      User_Booking_requesterIdToUser: {
        select: { id: true, username: true, displayName: true, avatar: true },
      },
    },
  });

  if (!booking) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  // Seuls le créateur et l'abonné concernés peuvent accéder
  if (booking.creatorId !== user.id && booking.requesterId !== user.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  return NextResponse.json(booking);
}
