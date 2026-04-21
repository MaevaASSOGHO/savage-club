// app/api/saved-posts/route.ts
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

// GET - Récupérer tous les posts sauvegardés
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      SavedPost: {
        orderBy: { createdAt: "desc" },
        include: {
          Post: {
            include: {
              User: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatar: true,
                  isVerified: true,
                },
              },
              PostMedia: { orderBy: { order: "asc" } },
              Like: { select: { id: true } },
              Comment: { select: { id: true } },
            },
          },
        },
      },
    },
  });

  if (!user) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const posts = user.SavedPost.map((s) => ({
    ...s.Post,
    medias:   (s.Post as any).PostMedia  ?? [],
    user:     (s.Post as any).User       ?? null,
    likes:    (s.Post as any).Like       ?? [],
    comments: (s.Post as any).Comment    ?? [],
  }));
  return NextResponse.json(posts);
}

// POST - Sauvegarder un post (avec ou sans collection)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    }

    const { postId, collectionId } = await req.json();

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    // Vérifier si le post est déjà sauvegardé
    const existing = await prisma.savedPost.findUnique({
      where: {
        userId_postId: {
          userId: user.id,
          postId,
        },
      },
    });

    if (existing) {
      // Si la collection est fournie, mettre à jour, sinon supprimer
      if (collectionId !== undefined) {
        const updated = await prisma.savedPost.update({
          where: {
            userId_postId: {
              userId: user.id,
              postId,
            },
          },
          data: {
            collectionId: collectionId || null,
          },
        });
        return NextResponse.json({ 
          saved: true, 
          collectionId: updated.collectionId 
        });
      } else {
        // Supprimer la sauvegarde
        await prisma.savedPost.delete({
          where: {
            userId_postId: {
              userId: user.id,
              postId,
            },
          },
        });
        return NextResponse.json({ saved: false });
      }
    } else {
      // Créer une nouvelle sauvegarde
      const saved = await prisma.savedPost.create({
        data: {
          id: crypto.randomUUID(),

          userId: user.id,
          postId,
          collectionId: collectionId || null,
        },
      });
      return NextResponse.json({ 
        saved: true, 
        collectionId: saved.collectionId 
      });
    }
  } catch (error) {
    console.error("Erreur sauvegarde:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}