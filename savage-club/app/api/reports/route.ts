import { getServerSession, authOptions } from "@/lib/auth-compat";
// app/api/reports/route.ts
import { prisma } from "@/lib/prisma";


import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const { type, targetId, reason, reasonId } = await req.json();

  if (!type || !targetId || !reason) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }

  const reporter = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!reporter) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  try {
    let postId = null;
    let reportedUserId = null;

    // Récupérer les informations selon le type
    if (type === "post") {
      const post = await prisma.post.findUnique({
        where: { id: targetId },
        select: { userId: true }
      });
      if (!post) {
        return NextResponse.json({ error: "Publication non trouvée" }, { status: 404 });
      }
      postId = targetId;
      reportedUserId = post.userId;
    } 
    else if (type === "user") {
      const user = await prisma.user.findUnique({
        where: { id: targetId }
      });
      if (!user) {
        return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
      }
      reportedUserId = targetId;
    }
    else if (type === "comment") {
      const comment = await prisma.comment.findUnique({
        where: { id: targetId },
        include: { Post: { select: { id: true } }, User: { select: { id: true } } }
      });
      if (!comment) {
        return NextResponse.json({ error: "Commentaire non trouvé" }, { status: 404 });
      }
      postId = comment.postId;
      reportedUserId = comment.userId;
    }

    // Vérifier qu'on ne se signale pas soi-même
    if (reportedUserId === reporter.id) {
      return NextResponse.json({ error: "Vous ne pouvez pas vous signaler vous-même" }, { status: 400 });
    }

    // Vérifier que le signalement n'existe pas déjà en attente
    const existingReport = await prisma.report.findFirst({
      where: {
        reporterId: reporter.id,
        postId: postId || undefined,
        reportedUserId: reportedUserId || undefined,
        status: "PENDING"
      }
    });

    if (existingReport) {
      return NextResponse.json({ error: "Vous avez déjà signalé ce contenu" }, { status: 400 });
    }

    // Créer le signalement
    const report = await prisma.report.create({
      data: {
        id: crypto.randomUUID(),
        reason: reason,
        status: "PENDING",
        reporterId: reporter.id,
        postId: postId,
        reportedUserId: reportedUserId,
      }
    });

    // Optionnel: Créer une notification pour les admins
    // await prisma.notification.create({
    //   data: {
    //     type: "REPORT",
    //     receiverId: "admin_id", // À définir selon votre système
    //     senderId: reporter.id,
    //     postId: postId,
    //   }
    // });

    return NextResponse.json({ 
      success: true, 
      reportId: report.id,
      message: "Signalement envoyé avec succès"
    });

  } catch (error) {
    console.error("Erreur création signalement:", error);
    return NextResponse.json({ error: "Erreur lors du signalement" }, { status: 500 });
  }
}