import { getServerSession, authOptions } from "@/lib/auth-compat";
// app/api/bookings/[id]/route.ts
import { prisma } from "@/lib/prisma";


import { NextResponse } from "next/server";
import crypto from "crypto";

const MAX_NEGOTIATIONS = 2;

// Helper pour créer une notification avec bookingId
async function createBookingNotif(
  tx: any,
  type: string,
  receiverId: string,
  senderId: string,
  bookingId: string
) {
  await tx.notification.create({
    data: {
      id: crypto.randomUUID(), // ← ajouter cette ligne
      type,
      receiverId,
      senderId,
      bookingId,
    } as any,
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const body = await req.json();
  const { action, proposedAt } = body;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const booking = await prisma.booking.findUnique({
    where: { id },
    select: {
      id: true, status: true, type: true, scheduledAt: true,
      creatorId: true, requesterId: true,
      negotiationCount: true, counterProposedBy: true,
      counterProposedAt: true, counterRepliedAt: true,
    },
  });

  if (!booking) return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });

  const isCreator   = booking.creatorId   === user.id;
  const isRequester = booking.requesterId === user.id;

  if (!isCreator && !isRequester) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const result = await prisma.$transaction(async (tx) => {

    // ── Confirmer ──────────────────────────────────────────────────────────
    if (action === "confirm") {
      if (!isCreator) return null;
      const updated = await tx.booking.update({
        where: { id }, data: { status: "CONFIRMED" },
      });
      await createBookingNotif(tx, "BOOKING_CONFIRMED", booking.requesterId, user.id, id);
      return updated;
    }

    // ── Annuler définitivement ─────────────────────────────────────────────
    if (action === "cancel") {
      const updated = await tx.booking.update({
        where: { id }, data: { status: "CANCELLED" },
      });
      const receiverId = isCreator ? booking.requesterId : booking.creatorId;
      await createBookingNotif(tx, "BOOKING_CANCELLED", receiverId, user.id, id);
      return updated;
    }

    // ── Créateur contre-propose un créneau ────────────────────────────────
    if (action === "counter_propose") {
      if (!isCreator || !proposedAt) return null;

      if (booking.negotiationCount >= MAX_NEGOTIATIONS) {
        const updated = await tx.booking.update({
          where: { id }, data: { status: "CANCELLED" },
        });
        await createBookingNotif(tx, "BOOKING_CANCELLED", booking.requesterId, user.id, id);
        return updated;
      }

      const updated = await tx.booking.update({
        where: { id },
        data: {
          status:            "COUNTER_PROPOSED",
          counterProposedAt: new Date(proposedAt),
          negotiationCount:  { increment: 1 },
          counterProposedBy: user.id,
        },
      });
      await createBookingNotif(tx, "BOOKING_RESCHEDULE", booking.requesterId, user.id, id);
      return updated;
    }

    // ── Abonné contre-répond ───────────────────────────────────────────────
    if (action === "counter_reply") {
      if (!isRequester || !proposedAt) return null;

      if (booking.negotiationCount >= MAX_NEGOTIATIONS) {
        const updated = await tx.booking.update({
          where: { id }, data: { status: "CANCELLED" },
        });
        await createBookingNotif(tx, "BOOKING_CANCELLED", booking.creatorId, user.id, id);
        return updated;
      }

      const updated = await tx.booking.update({
        where: { id },
        data: {
          status:            "COUNTER_REPLIED",
          counterRepliedAt:  new Date(proposedAt),
          negotiationCount:  { increment: 1 },
          counterProposedBy: user.id,
        },
      });
      await createBookingNotif(tx, "BOOKING_RESCHEDULE", booking.creatorId, user.id, id);
      return updated;
    }

    // ── Accepter la contre-proposition ────────────────────────────────────
    if (action === "accept_counter") {
      const newSlot = booking.status === "COUNTER_PROPOSED"
        ? booking.counterProposedAt
        : booking.counterRepliedAt;

      const updated = await tx.booking.update({
        where: { id },
        data: { status: "CONFIRMED", scheduledAt: newSlot ?? booking.scheduledAt },
      });
      const receiverId = isCreator ? booking.requesterId : booking.creatorId;
      await createBookingNotif(tx, "BOOKING_CONFIRMED", receiverId, user.id, id);
      return updated;
    }

    return null;
  });

  if (!result) return NextResponse.json({ error: "Action invalide" }, { status: 400 });
  return NextResponse.json(result);
}
