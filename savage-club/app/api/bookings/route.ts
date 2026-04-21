// app/api/bookings/route.ts
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

// GET /api/bookings — réservations de l'utilisateur connecté
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
      User_Booking_creatorIdToUser: { 
        select: { id: true, username: true, displayName: true, avatar: true } 
      },
      User_Booking_requesterIdToUser: { 
        select: { id: true, username: true, displayName: true, avatar: true } 
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

// POST /api/bookings — créer une réservation + simuler le paiement
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const body = await req.json();
  const { creatorId, type, scheduledAt, amount, note } = body;

  if (!creatorId || !type || !scheduledAt || typeof amount !== "number") {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }
  if (!["AUDIO_CALL", "VIDEO_CALL"].includes(type)) {
    return NextResponse.json({ error: "Type invalide" }, { status: 400 });
  }

  const requester = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!requester) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  if (requester.id === creatorId) {
    return NextResponse.json({ error: "Impossible de vous réserver vous-même" }, { status: 400 });
  }

  // Vérifier que le demandeur a bien un abonnement SAVAGE ou VIP
  const sub = await prisma.subscription.findFirst({
    where: { subscriberId: requester.id, creatorId, status: "ACTIVE" },
    select: { tier: true },
  });

  if (!sub || sub.tier === "FREE") {
    return NextResponse.json({ error: "Abonnement Savage requis pour réserver un appel" }, { status: 403 });
  }

  // Créer la réservation + paiement simulé dans une transaction
  const [booking, payment] = await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.create({
      data: {
        id:          crypto.randomUUID(),
        type,
        status:      "PENDING_CONFIRM",
        scheduledAt: new Date(scheduledAt),
        duration:    10,
        amount,
        reference: `BOOKING_${Date.now()}`,
        note:        note ?? null,
        updatedAt:   new Date(),
        User_Booking_requesterIdToUser: { connect: { id: requester.id } },
        User_Booking_creatorIdToUser:   { connect: { id: creatorId } },
      },
    });

    // Enregistrer le paiement
    const paymentType = type === "VIDEO_CALL" ? "VIDEO_CALL" : "AUDIO_CALL";
    const payment = await tx.payment.create({
      data: {
        id:          crypto.randomUUID(),
        amount,
        status: "SUCCESS",
        type: paymentType,
        description: `${type === "VIDEO_CALL" ? "Appel vidéo" : "Appel audio"} — ${new Date(scheduledAt).toLocaleDateString("fr-FR")}`,
        reference: booking.reference,
        User_Payment_payerIdToUser: { connect: { id: requester.id } },
        User_Payment_recipientIdToUser: { connect: { id: creatorId } },
      },
    });

    // Créer une notification pour le créateur
    await tx.notification.create({
      data: {
        id:          crypto.randomUUID(),
        type: "BOOKING",
        receiverId: creatorId,
        senderId: requester.id,
      },
    });

    return [booking, payment];
  });

  // ✅ FORMATAGE de la réponse POST (optionnel)
  const formattedBooking = {
    id: booking.id,
    type: booking.type,
    status: booking.status,
    scheduledAt: booking.scheduledAt,
    duration: booking.duration,
    amount: booking.amount,
    reference: booking.reference,
    note: booking.note,
  };

  const formattedPayment = {
    id: payment.id,
    amount: payment.amount,
    status: payment.status,
    type: payment.type,
    reference: payment.reference,
  };

  return NextResponse.json({ booking: formattedBooking, payment: formattedPayment }, { status: 201 });
}