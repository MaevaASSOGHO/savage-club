import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request) {
  const authHeader = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  const isVercelCron = request.headers.get('x-vercel-cron') === '1';
  
  if (secret && authHeader !== `Bearer ${secret}` && !isVercelCron) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  
  try {
    // Nettoyer les notifications de plus de 30 jours
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Compter d'abord
    const count = await prisma.notification.count({
      where: {
        createdAt: { lt: thirtyDaysAgo }
      }
    });
    
    // Supprimer
    const deleted = await prisma.notification.deleteMany({
      where: {
        createdAt: { lt: thirtyDaysAgo }
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      deleted: deleted.count,
      remaining: await prisma.notification.count(),
      message: `Nettoyage terminé: ${deleted.count} notifications supprimées sur ${count} trouvées`
    });
  } catch (error) {
    console.error("Erreur nettoyage:", error);
    return NextResponse.json({ error: "Erreur lors du nettoyage" }, { status: 500 });
  }
}

// app/api/cleanup/notifications/route.ts