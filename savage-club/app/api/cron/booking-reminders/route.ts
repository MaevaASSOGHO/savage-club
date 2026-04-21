// app/api/cron/booking-reminders/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const now = new Date();
    const in15Minutes = new Date(now.getTime() + 15 * 60 * 1000);
    const in1Minute = new Date(now.getTime() + 1 * 60 * 1000);
    
    // Récupérer les appels qui commencent dans 15 minutes
    const reminders15min = await prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        scheduledAt: {
          gte: new Date(in15Minutes.getTime() - 30 * 1000),
          lte: new Date(in15Minutes.getTime() + 30 * 1000),
        },
        // Vérifier qu'il n'y a pas déjà une notification envoyée récemment
        NOT: {
          id: {
            in: (
              await prisma.notification.findMany({
                where: {
                  type: "BOOKING_REMINDER",
                  bookingId: { not: null },
                  createdAt: {
                    gte: new Date(now.getTime() - 5 * 60 * 1000), // Dans les 5 dernières minutes
                  },
                },
                select: { bookingId: true },
              })
            ).map(n => n.bookingId).filter((id): id is string => id !== null),
          },
        },
      },
      include: {
        User_Booking_requesterIdToUser: true,
        User_Booking_creatorIdToUser:   true,
      },
    });

    // Récupérer les appels qui commencent maintenant
    const remindersNow = await prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        scheduledAt: {
          gte: new Date(now.getTime() - 30 * 1000),
          lte: new Date(now.getTime() + 30 * 1000),
        },
        NOT: {
          id: {
            in: (
              await prisma.notification.findMany({
                where: {
                  type: "BOOKING_START",
                  bookingId: { not: null },
                  createdAt: {
                    gte: new Date(now.getTime() - 5 * 60 * 1000),
                  },
                },
                select: { bookingId: true },
              })
            ).map(n => n.bookingId).filter((id): id is string => id !== null),
          },
        },
      },
      include: {
        User_Booking_requesterIdToUser: true,
        User_Booking_creatorIdToUser:   true,
      },
    });
    // Créer les notifications pour les rappels 15 minutes
    for (const booking of reminders15min) {
      await prisma.notification.create({
        data: {
          id: crypto.randomUUID(),
          type: "BOOKING_REMINDER",
          bookingId: booking.id,
          receiverId: booking.requesterId,
          isRead: false,
        },
      });

      await prisma.notification.create({
        data: {
          id: crypto.randomUUID(),
          type: "BOOKING_REMINDER",
          bookingId: booking.id,
          receiverId: booking.creatorId,
          isRead: false,
        },
      });
    }

    // Créer les notifications pour les appels qui commencent
    for (const booking of remindersNow) {
      await prisma.notification.create({
        data: {
          id: crypto.randomUUID(),
          type: "BOOKING_START",
          bookingId: booking.id,
          receiverId: booking.requesterId,
          isRead: false,
        },
      });

      await prisma.notification.create({
        data: {
          id: crypto.randomUUID(),
          type: "BOOKING_START",
          bookingId: booking.id,
          receiverId: booking.creatorId,
          isRead: false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      reminders15min: reminders15min.length,
      remindersNow: remindersNow.length,
    });
  } catch (error) {
    console.error("Erreur lors des rappels:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}