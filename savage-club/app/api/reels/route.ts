import { getServerSession, authOptions } from "@/lib/auth-compat";
// app/api/reels/route.ts
import { prisma } from "@/lib/prisma";


import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "3");
  const skip = (page - 1) * limit;

  const reels = await prisma.post.findMany({
    where: {
      status: "PUBLISHED",
      visibility: "PUBLIC",
      PostMedia: {
        some: { type: "VIDEO" }
      }
    },
    include: {
      User: {  // ✅ Correct : "User" avec U majuscule
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          isVerified: true,
        },
      },
      PostMedia: {
        where: { type: "VIDEO" },
        orderBy: { order: "asc" },
        take: 1,
      },
      Like: {  // ✅ "Like" avec L majuscule
        select: {
          id: true,
          userId: true,
        },
      },
      Comment: {  // ✅ "Comment" avec C majuscule
        select: {
          id: true,
        },
      },
      _count: {
        select: {
          Like: true,     // ✅ Utiliser "Like" pour le compteur
          Comment: true,  // ✅ Utiliser "Comment" pour le compteur
        }
      }
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
  });

  // Filtrer pour ne garder que les posts qui ont au moins une vidéo
  const validReels = reels.filter(post => post.PostMedia.length > 0);

  // ✅ Formater les données pour le frontend (optionnel mais recommandé)
  const formattedReels = validReels.map(reel => ({
    id: reel.id,
    content: reel.content,
    createdAt: reel.createdAt,
    user: {
      id: reel.User.id,
      username: reel.User.username,
      displayName: reel.User.displayName,
      avatar: reel.User.avatar,
      isVerified: reel.User.isVerified,
    },
    medias: reel.PostMedia,
    likes: reel.Like,           // Tableau des likes
    comments: reel.Comment,     // Tableau des commentaires
    likesCount: reel._count?.Like ?? 0,
    commentsCount: reel._count?.Comment ?? 0,
  }));

  return NextResponse.json(formattedReels);
}