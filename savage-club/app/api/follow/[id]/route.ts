import { getServerSession, authOptions } from "@/lib/auth-compat";
// app/api/follow/[id]/route.ts
import { prisma } from "@/lib/prisma";


import { NextResponse } from "next/server";

// ✅ Correction : extraire correctement l'ID des params
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    }

    // Résoudre params si c'est une Promise (Next.js 15+)
    const { id: followingId } = await params;

    if (!followingId) {
      return NextResponse.json({ error: "ID utilisateur manquant" }, { status: 400 });
    }

    const me = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!me) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Empêcher de se follow soi-même
    if (me.id === followingId) {
      return NextResponse.json({ error: "Vous ne pouvez pas vous suivre vous-même" }, { status: 400 });
    }

    // Vérifier si le follow existe déjà
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: me.id,
          followingId: followingId,
        },
      },
    });

    if (existingFollow) {
      return NextResponse.json({ error: "Déjà abonné" }, { status: 400 });
    }

    await prisma.follow.create({
      data: {
        id: crypto.randomUUID(),
        followerId: me.id,
        followingId: followingId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur POST follow:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    }

    const { id: followingId } = await params;

    if (!followingId) {
      return NextResponse.json({ error: "ID utilisateur manquant" }, { status: 400 });
    }

    const me = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!me) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const result = await prisma.follow.deleteMany({
      where: {
        followerId: me.id,
        followingId: followingId,
      },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Abonnement non trouvé" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE follow:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}