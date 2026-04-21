import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  // Ajouter une authentification avec un secret pour sécuriser
  const authHeader = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const deleted = await prisma.notification.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo
        }
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      deleted: deleted.count,
      message: `${deleted.count} notifications supprimées`
    });
  } catch (error) {
    console.error("Erreur nettoyage notifications:", error);
    return NextResponse.json({ error: "Erreur lors du nettoyage" }, { status: 500 });
  }
}

// app/api/cleanup/notifications/route.ts