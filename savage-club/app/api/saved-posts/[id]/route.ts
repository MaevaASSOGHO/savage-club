import { getServerSession, authOptions } from "@/lib/auth-compat";
// app/api/saved-posts/[postId]/route.ts
import { prisma } from "@/lib/prisma";


import { NextResponse, NextRequest } from "next/server";

// GET - Vérifier si un post spécifique est sauvegardé
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ saved: false });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ saved: false });
    }

    const saved = await prisma.savedPost.findUnique({
      where: {
        userId_postId: {
          userId: user.id,
          postId: id, // ✅ on map id → postId DB
        },
      },
      select: {
        collectionId: true,
      },
    });

    return NextResponse.json({ 
      saved: !!saved,
      collectionId: saved?.collectionId || null 
    });

  } catch (error) {
    console.error("Erreur vérification sauvegarde:", error);
    return NextResponse.json({ saved: false }, { status: 500 });
  }
}

// DELETE - Supprimer un post des sauvegardes
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    await prisma.savedPost.delete({
      where: {
        userId_postId: {
          userId: user.id,
          postId: id, // ✅ mapping correct
        },
      },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Erreur suppression sauvegarde:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}