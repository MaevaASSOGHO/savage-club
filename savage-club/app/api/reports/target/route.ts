// app/api/reports/target/route.ts
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");

  if (!type || !id) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  try {
    let targetInfo = null;

    if (type === "post") {
      const post = await prisma.post.findUnique({
        where: { id },
        select: {
          id: true,
          content: true,
          PostMedia: { take: 1, select: { url: true, type: true } },
          User: { select: { username: true, avatar: true } }
        }
      });

      if (!post) {
        return NextResponse.json({ error: "Post non trouvé" }, { status: 404 });
      }

      targetInfo = {
        type: "post",
        id: post.id,
        preview: post.content || "Publication sans texte",
        medias: post.PostMedia[0]?.url || null,
        username: post.User.username
      };
    } 
    else if (type === "user") {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          bio: true
        }
      });

      if (!user) {
        return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
      }

      targetInfo = {
        type: "user",
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        preview: user.bio || "Aucune bio",
        avatar: user.avatar
      };
    }
    else if (type === "comment") {
      const comment = await prisma.comment.findUnique({
        where: { id },
        select: {
          id: true,
          text: true,
          createdAt: true,
          User: { select: { username: true, avatar: true } },
          Post: { select: { id: true } }
        }
      });

      if (!comment) {
        return NextResponse.json({ error: "Commentaire non trouvé" }, { status: 404 });
      }

      targetInfo = {
        type: "comment",
        id: comment.id,
        preview: comment.text,
        username: comment.User.username,
        postId: comment.Post.id
      };
    }

    return NextResponse.json(targetInfo);

  } catch (error) {
    console.error("Erreur récupération cible:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}