// app/api/collections/route.ts
import { prisma }            from "@/lib/prisma";
import { NextResponse }      from "next/server";
import { getSessionUserId }  from "@/lib/get-session-user";

export async function POST(req: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { name } = await req.json();

    const collection = await prisma.collection.create({
      data: {
        id:        crypto.randomUUID(),
        name,
        userId,
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
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where:   { id: userId },
      include: {
        Collection: {
          orderBy: { createdAt: "desc" },
          include: {
            SavedPost: {
              orderBy: { createdAt: "desc" },
              include: {
                Post: {
                  include: {
                    User:      { select: { id: true, username: true, displayName: true, avatar: true, isVerified: true } },
                    PostMedia: { orderBy: { order: "asc" } },
                    Like:      { select: { id: true } },
                    Comment:   { select: { id: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) return NextResponse.json([], { status: 200 });

    const formattedCollections = user.Collection.map((collection) => ({
      id:        collection.id,
      name:      collection.name,
      createdAt: collection.createdAt,
      posts:     collection.SavedPost.map((savedPost) => {
        const post = savedPost.Post;
        return {
          id:         post.id,
          content:    post.content || "",
          visibility: post.visibility,
          createdAt:  post.createdAt,
          user: {
            id:          post.User.id,
            username:    post.User.username,
            displayName: post.User.displayName,
            avatar:      post.User.avatar,
            isVerified:  post.User.isVerified,
          },
          medias:   post.PostMedia?.map((m) => ({ id: m.id, url: m.url, type: m.type, order: m.order })) || [],
          likes:    post.Like    || [],
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