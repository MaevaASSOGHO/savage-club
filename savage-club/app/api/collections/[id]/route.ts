// app/api/collections/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name } = await req.json();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const collection = await prisma.collection.update({
      where: { id },
      data: { name },
    });

    return NextResponse.json(collection);
  } catch (error) {
    console.error("Erreur modification collection:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Mettre à jour les savedPosts pour enlever la référence à la collection
    await prisma.savedPost.updateMany({
      where: { collectionId: id },
      data: { collectionId: null },
    });

    // Supprimer la collection
    await prisma.collection.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression collection:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}