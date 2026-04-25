import { getServerSession, authOptions } from "@/lib/auth-compat";
// app/api/collections/route.ts
import { prisma } from "@/lib/prisma";


import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { name } = await req.json();

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const collection = await prisma.collection.create({
      data: {
        id: crypto.randomUUID(),
        name,
        userId: user.id,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(collection);
  } catch (error) {
    console.error("Erreur création collection:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        Collection: {
          orderBy: { createdAt: "desc" },
          include: {
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
                    PostMedia: {  // ✅ IMPORTANT : inclure les médias
                      orderBy: { order: "asc" },
                    },
                    Like: {
                      select: { id: true },
                    },
                    Comment: {
                      select: { id: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json([], { status: 200 });
    }

    // ✅ Formater les données avec les médias
    const formattedCollections = user.Collection.map(collection => ({
      id: collection.id,
      name: collection.name,
      createdAt: collection.createdAt,
      posts: collection.SavedPost.map(savedPost => {
        const post = savedPost.Post;
        return {
          id: post.id,
          content: post.content || "",
          visibility: post.visibility,
          createdAt: post.createdAt,
          user: {
            id: post.User.id,
            username: post.User.username,
            displayName: post.User.displayName,
            avatar: post.User.avatar,
            isVerified: post.User.isVerified,
          },
          medias: post.PostMedia?.map(media => ({  // ✅ Récupérer les médias
            id: media.id,
            url: media.url,
            type: media.type,
            order: media.order,
          })) || [],
          likes: post.Like || [],
          comments: post.Comment || [],
        };
      }),
    }));

    return NextResponse.json(formattedCollections);
  } catch (error) {
    console.error("Erreur récupération collections:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}