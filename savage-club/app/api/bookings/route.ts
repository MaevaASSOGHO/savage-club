import { getServerSession, authOptions } from "@/lib/auth-compat";
// app/api/bookings/route.ts
import { prisma }       from "@/lib/prisma";
import { NextResponse } from "next/server";

// ── GET ────────────────────────────────────────────────────────────────────
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
      User_Booking_creatorIdToUser:   { select: { id: true, username: true, displayName: true, avatar: true } },
      User_Booking_requesterIdToUser: { select: { id: true, username: true, displayName: true, avatar: true } },
    },
  });

  const formattedBookings = bookings.map((booking) => ({
    id:                booking.id,
    type:              booking.type,
    status:            booking.status,
    scheduledAt:       booking.scheduledAt,
    counterProposedAt: booking.counterProposedAt,
    counterRepliedAt:  booking.counterRepliedAt,
    negotiationCount:  booking.negotiationCount,
    duration:          booking.duration,
    amount:            booking.amount,
    note:              booking.note,
    requester: {
      id:          booking.User_Booking_requesterIdToUser.id,
      username:    booking.User_Booking_requesterIdToUser.username,
      displayName: booking.User_Booking_requesterIdToUser.displayName,
      avatar:      booking.User_Booking_requesterIdToUser.avatar,
    },
    creator: {
      id:          booking.User_Booking_creatorIdToUser.id,
      username:    booking.User_Booking_creatorIdToUser.username,
      displayName: booking.User_Booking_creatorIdToUser.displayName,
      avatar:      booking.User_Booking_creatorIdToUser.avatar,
    },
  }));

  return NextResponse.json(formattedBookings);
}

// ── POST ───────────────────────────────────────────────────────────────────
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
    where:  { email: session.user.email },
    select: { id: true, username: true, displayName: true },
  });
  if (!requester) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  if (requester.id === creatorId) {
    return NextResponse.json({ error: "Impossible de vous réserver vous-même" }, { status: 400 });
  }

  // Vérifier abonnement SAVAGE ou VIP
  const sub = await prisma.subscription.findFirst({
    where:  { subscriberId: requester.id, creatorId, status: "ACTIVE" },
    select: { tier: true },
  });
  if (!sub || sub.tier === "FREE") {
    return NextResponse.json({ error: "Abonnement Savage requis pour réserver un appel" }, { status: 403 });
  }

  // Appel gratuit → créer directement sans paiement
  if (amount === 0) {
    const booking = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.create({
        data: {
          id:          crypto.randomUUID(),
          type,
          status:      "PENDING_CONFIRM",
          scheduledAt: new Date(scheduledAt),
          duration:    10,
          amount:      0,
          reference:   `BOOKING_${Date.now()}`,
          note:        note ?? null,
          updatedAt:   new Date(),
          User_Booking_requesterIdToUser: { connect: { id: requester.id } },
          User_Booking_creatorIdToUser:   { connect: { id: creatorId } },
        },
      });
      await tx.notification.create({
        data: {
          id:         crypto.randomUUID(),
          type:       "BOOKING",
          receiverId: creatorId,
          senderId:   requester.id,
        },
      });
      return b;
    });
    return NextResponse.json({
      booking:     { id: booking.id, type: booking.type, status: booking.status, scheduledAt: booking.scheduledAt, amount: 0 },
      payment:     null,
      redirectUrl: null,
    }, { status: 201 });
  }

  // Appel payant → réservation PENDING + initier paiement MoneyFusion
  const reference = `BOOKING_${Date.now()}`;

  const [booking, payment] = await prisma.$transaction(async (tx) => {
    const b = await tx.booking.create({
      data: {
        id:          crypto.randomUUID(),
        type,
        status:      "PENDING_CONFIRM",
        scheduledAt: new Date(scheduledAt),
        duration:    10,
        amount,
        reference,
        note:        note ?? null,
        updatedAt:   new Date(),
        User_Booking_requesterIdToUser: { connect: { id: requester.id } },
        User_Booking_creatorIdToUser:   { connect: { id: creatorId } },
      },
    });

    const p = await tx.payment.create({
      data: {
        id:            crypto.randomUUID(),
        amount,
        status:        "PENDING",
        type:          type === "VIDEO_CALL" ? "VIDEO_CALL" : "AUDIO_CALL",
        provider:      "MONEYFUSION",
        platformFee:   Math.round(amount * 0.1),
        creatorAmount: Math.round(amount * 0.9),
        description:   `${type === "VIDEO_CALL" ? "Appel vidéo" : "Appel audio"} — ${new Date(scheduledAt).toLocaleDateString("fr-FR")}`,
        reference:     b.reference,
        User_Payment_payerIdToUser:     { connect: { id: requester.id } },
        User_Payment_recipientIdToUser: { connect: { id: creatorId } },
      },
    });

    return [b, p];
  });

  // Appeler MoneyFusion via Railway proxy
  const PROXY_URL = `${process.env.API_URL}/payments/moneyfusion/create`;
  const APP_URL   = process.env.NEXTAUTH_URL || "https://savage-club.vercel.app";

  let redirectUrl: string | null = null;

  try {
    const mfRes = await fetch(PROXY_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        totalPrice:    amount,
        article:       [{ savage_club: amount }],
        numeroSend:    "0000000000",
        nomclient:     requester.displayName || requester.username || "Utilisateur",
        personal_Info: [{
          paymentId: payment.id,
          userId:    requester.id,
          type:      "BOOKING",
          bookingId: booking.id,
        }],
        return_url: `${APP_URL}/payments/confirm?type=booking`,
        webhook_url: `${APP_URL}/api/webhooks/moneyfusion`,
      }),
    });

    const mfData = await mfRes.json();

    if (mfData.statut) {
      await prisma.payment.update({
        where: { id: payment.id },
        data:  { providerRef: mfData.token },
      });
      redirectUrl = mfData.url;
    }
  } catch (err) {
    console.error("[Booking] Erreur MoneyFusion:", err);
    // Ne pas bloquer — la réservation existe, le paiement sera relancé
  }

  return NextResponse.json({
    booking: {
      id:          booking.id,
      type:        booking.type,
      status:      booking.status,
      scheduledAt: booking.scheduledAt,
      amount:      booking.amount,
    },
    payment: {
      id:     payment.id,
      amount: payment.amount,
      status: payment.status,
    },
    redirectUrl, // ← null si MF échoue, URL si OK
  }, { status: 201 });
}
