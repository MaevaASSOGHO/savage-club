// app/api/onboarding/suggestions/route.ts
//
// Retourne au moins 5 comptes à suivre basés sur les catégories de l'utilisateur.
// Si la catégorie n'a pas assez de comptes, on complète avec les comptes
// les plus populaires toutes catégories confondues.

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-compat";
import { prisma } from "@/lib/prisma";

const MIN_SUGGESTIONS = 5;

export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.id) return NextResponse.json([], { status: 401 });

  // Récupérer les catégories choisies par l'utilisateur
  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { interests: true },   // champ JSON/String[] stocké lors de StepCategories
  });

  const interests: string[] = (user?.interests as string[]) ?? [];

  // 1. Comptes correspondant aux catégories choisies
  const byCategory = interests.length > 0
    ? await prisma.user.findMany({
        where: {
          id:       { not: session.user.id },
          role:     { in: ["CREATOR", "TRAINER"] },
          category: { in: interests },
        },
        select: {
          id:          true,
          username:    true,
          displayName: true,
          avatar:      true,
          isVerified:  true,
          category:    true,
          _count:      { select: { Follow_Follow_followingIdToUser: true } },
        },
        orderBy: { Follow_Follow_followingIdToUser: { _count: "desc" } },
        take: MIN_SUGGESTIONS * 2,
      })
    : [];

  // 2. Compléter avec les plus populaires si besoin
  let suggestions = byCategory;
  if (suggestions.length < MIN_SUGGESTIONS) {
    const existingIds = new Set(suggestions.map(u => u.id));
    const popular = await prisma.user.findMany({
      where: {
        id:   { notIn: [session.user.id, ...existingIds] },
        role: { in: ["CREATOR", "TRAINER"] },
      },
      select: {
        id:          true,
        username:    true,
        displayName: true,
        avatar:      true,
        isVerified:  true,
        category:    true,
        _count:      { select: { Follow_Follow_followingIdToUser: true } },
      },
      orderBy: { Follow_Follow_followingIdToUser: { _count: "desc" } },
      take: MIN_SUGGESTIONS - suggestions.length,
    });
    suggestions = [...suggestions, ...popular];
  }

  // Formater la réponse
  const result = suggestions.slice(0, MIN_SUGGESTIONS * 2).map(u => ({
    id:             u.id,
    username:       u.username,
    displayName:    u.displayName,
    avatar:         u.avatar,
    isVerified:     u.isVerified,
    category:       u.category ?? "Créateur",
    followersCount: u._count.Follow_Follow_followingIdToUser,
  }));

  return NextResponse.json(result);
}
