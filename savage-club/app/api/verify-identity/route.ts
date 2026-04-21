// app/api/verify-identity/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────────
// POST /api/verify-identity
// Upload document + selfie
// ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userId = session.user.id;

    // 🔍 Récupérer user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        verificationStatus: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    // 🚨 Vérifier si c'est un créateur/formateur
    if (user.role !== "CREATOR" && user.role !== "TRAINER") {
      return NextResponse.json(
        { error: "Seuls les créateurs et formateurs peuvent demander une vérification" },
        { status: 403 }
      );
    }

    // 🚨 Empêche spam
    if (user.verificationStatus === "PENDING") {
      return NextResponse.json(
        { error: "Une demande est déjà en cours de traitement" },
        { status: 400 }
      );
    }

    // 📦 Récupérer fichiers
    const formData = await req.formData();
    const document = formData.get("document") as File | null;
    const selfie = formData.get("selfie") as File | null;

    if (!document || !selfie) {
      return NextResponse.json(
        { error: "Document et selfie obligatoires" },
        { status: 400 }
      );
    }

    // ⚠️ Validation basique
    if (document.size > 10 * 1024 * 1024 || selfie.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Fichier trop volumineux (max 10MB)" },
        { status: 400 }
      );
    }

    // ─────────────────────────────────────────────
    // 🔥 UPLOAD (à adapter selon ton système)
    // ─────────────────────────────────────────────
    async function uploadFile(file: File): Promise<string> {
      // 👉 TODO: remplacer par Cloudinary ou S3
      // simulation temporaire
      return `https://fake-upload.com/${Date.now()}-${file.name}`;
    }

    const idDocumentUrl = await uploadFile(document);
    const selfieUrl = await uploadFile(selfie);

    // ─────────────────────────────────────────────
    // 💾 Sauvegarde en base
    // ─────────────────────────────────────────────
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        idDocumentUrl,
        selfieUrl,
        verificationStatus: "PENDING",
        idVerified: false,
      },
      select: {
        idDocumentUrl: true,
        selfieUrl: true,
        verificationStatus: true,
        idVerified: true,
      },
    });

    // 🔔 NOTIFICATION : Envoyer une notification aux admins
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          id: crypto.randomUUID(),
          type: "MENTION", // Tu peux créer un type "IDENTITY_PENDING" si besoin
          receiverId: admin.id,
          senderId: userId,
          isRead: false,
        },
      });
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Erreur verify-identity:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}