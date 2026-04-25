import { getServerSession, authOptions } from "@/lib/auth-compat";
// app/api/comments/route.ts
import { prisma } from "@/lib/prisma";


import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const { postId, text } = await req.json();
  if (!text?.trim()) {
    return NextResponse.json({ error: "Commentaire vide" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  // Récupérer le post pour connaître l'auteur
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { userId: true }
  });

  if (!post) {
    return NextResponse.json({ error: "Post non trouvé" }, { status: 404 });
  }

  // Créer le commentaire
  const comment = await prisma.comment.create({
    data: { 
      id:          crypto.randomUUID(),
      text, 
      postId, 
      userId: user.id,
      createdAt: new Date(),
    },
    include: {
      User: { select: { username: true, avatar: true } },
    },
  });

  // Créer une notification pour l'auteur du post (si ce n'est pas l'auteur du commentaire)
  if (post.userId !== user.id) {
    await prisma.notification.create({
      data: {
        id:          crypto.randomUUID(),
        type: "COMMENT",
        postId: postId,
        receiverId: post.userId,
        senderId: user.id,
        isRead: false,
      },
    });
  }

  return NextResponse.json(comment);
}