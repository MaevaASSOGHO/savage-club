import { getServerSession, authOptions } from "@/lib/auth-compat";
// app/api/creator-agreement/route.ts
import { prisma } from "@/lib/prisma";


import { NextResponse } from "next/server";

// Version actuelle des règles — incrémenter si les règles changent
// Forcer la ré-acceptation pour tous les utilisateurs existants
const CURRENT_VERSION = "1.0";

// GET — vérifier si l'utilisateur a déjà accepté la version actuelle
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ accepted: false });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ accepted: false });

  const agreement = await prisma.creatorAgreement.findFirst({
    where: { userId: user.id, version: CURRENT_VERSION },
    select: { id: true, acceptedAt: true },
  });

  return NextResponse.json({
    accepted: !!agreement,
    acceptedAt: agreement?.acceptedAt ?? null,
    version: CURRENT_VERSION,
  });
}

// POST — enregistrer l'acceptation
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  // Upsert — éviter les doublons si déjà accepté
  const agreement = await prisma.creatorAgreement.upsert({
    where: {
      userId_version: { userId: user.id, version: CURRENT_VERSION },
    },
    update: { acceptedAt: new Date() },
    create: {
      userId:     user.id,
      version:    CURRENT_VERSION,
      acceptedAt: new Date(),
    },
  });

  return NextResponse.json({ accepted: true, acceptedAt: agreement.acceptedAt });
}
