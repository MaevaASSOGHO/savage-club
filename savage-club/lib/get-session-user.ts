// lib/get-session-user.ts
// Helper partagé — remplace prisma.user.findUnique({ where: { email } })
// dans toutes les routes API. Cache l'ID utilisateur 5 minutes dans Redis.

import { getServerSession, authOptions } from "@/lib/auth-compat";
import { prisma }                        from "@/lib/prisma";
import { getCached, setCached }          from "@/lib/cache";

type SessionUser = {
  id:         string;
  email:      string;
  role:       string;
  isVerified: boolean;
};

/**
 * Récupère l'utilisateur connecté depuis la session.
 * Résultat mis en cache 5 minutes — zéro requête DB sur les appels répétés.
 *
 * Usage dans une route :
 *   const user = await getSessionUser();
 *   if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const email    = session.user.email;
  const cacheKey = `session-user:${email}`;

  const cached = await getCached<SessionUser>(cacheKey);
  if (cached) return cached;

  const user = await prisma.user.findUnique({
    where:  { email },
    select: { id: true, email: true, role: true, isVerified: true },
  });

  if (user) await setCached(cacheKey, user, "user");

  return user;
}

/**
 * Variante qui retourne uniquement l'ID — pour les routes qui n'ont
 * besoin que de l'ID (la majorité).
 */
export async function getSessionUserId(): Promise<string | null> {
  const user = await getSessionUser();
  return user?.id ?? null;
}