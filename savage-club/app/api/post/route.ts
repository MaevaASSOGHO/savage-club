import { getServerSession, authOptions } from "@/lib/auth-compat";
// app/api/posts/route.ts
import { prisma } from "@/lib/prisma";


import { NextResponse } from "next/server";

export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      where: { status: "PUBLISHED" },
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
        Like: true,
        Comment: {
          where: { parentId: null },
          include: {
            User: { select: { id: true, username: true, avatar: true } },
          },
          orderBy: { createdAt: "asc" },
          take: 2,
        },
        _count: { select: { Comment: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Erreur GET posts:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
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

    const body = await req.json();
    console.log("📝 Body reçu:", JSON.stringify(body, null, 2)); // 👈 Log du body

    const { content, category, visibility, price, medias } = body;

    // Validation des données
    if (!content && (!medias || medias.length === 0)) {
      return NextResponse.json({ error: "Le contenu ou les médias sont requis" }, { status: 400 });
    }

    // Validation des médias
    if (medias && medias.length > 0) {
      for (const media of medias) {
        if (!media.url || !media.type) {
          return NextResponse.json({ error: "Format de média invalide" }, { status: 400 });
        }
        if (media.type !== "IMAGE" && media.type !== "VIDEO") {
          return NextResponse.json({ error: "Type de média invalide" }, { status: 400 });
        }
      }
    }

    const post = await prisma.post.create({
      data: {
        id: crypto.randomUUID(),
        content: content || null,
        category: category || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        visibility: visibility ?? "PUBLIC",
        price: price ? parseInt(price) : null,
        status: "PUBLISHED",
        userId: user.id,
        PostMedia: medias && medias.length > 0 ? {
          create: medias.map((m: { url: string; type: string; order: number }, index: number) => ({
            id: crypto.randomUUID(),
            url: m.url,
            type: m.type as "IMAGE" | "VIDEO",
            order: m.order ?? index,
          })),
        } : undefined,
      },
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
        Like: true,
        Comment: true,
        _count: { select: { Comment: true } },
      },
    });

    console.log("✅ Post créé avec succès:", post.id);
    return NextResponse.json(post, { status: 201 });

  } catch (error) {
    console.error("❌ Erreur POST posts:", error);
    // Renvoyer l'erreur détaillée en développement
    return NextResponse.json(
      { 
        error: "Erreur lors de la publication", 
        details: error instanceof Error ? error.message : "Erreur inconnue"
      },
      { status: 500 }
    );
  }
}