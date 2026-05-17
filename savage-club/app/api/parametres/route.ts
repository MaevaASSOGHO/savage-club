

// app/api/parametres/route.ts

import { getServerSession, authOptions } from "@/lib/auth-compat";
import { prisma as prismaParametres }    from "@/lib/prisma";
import { NextResponse as NR }            from "next/server";
import bcrypt                            from "bcryptjs";
import { invalidateCache as inv }        from "@/lib/cache";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NR.json({ error: "Non connecté" }, { status: 401 });
  }

  const body = await req.json();
  const {
    action, displayName, email, bio, location, website,
    currentPassword, newPassword,
    subscriptionPrice, subscriptionVIP,
    audioCallPrice, videoCallPrice, messagePrice,
    newRole,
  } = body;

  const user = await prismaParametres.user.findUnique({
    where:  { email: session.user.email },
    select: { id: true, password: true, role: true, username: true },
  });
  if (!user) return NR.json({ error: "Introuvable" }, { status: 404 });

  if (action === "change_password") {
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return NR.json({ error: "Mot de passe actuel incorrect" }, { status: 400 });
    if (!newPassword || newPassword.length < 8) {
      return NR.json({ error: "Le nouveau mot de passe doit faire au moins 8 caractères" }, { status: 400 });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await prismaParametres.user.update({ where: { id: user.id }, data: { password: hashed } });
    return NR.json({ success: true });
  }

  if (action === "change_role") {
    const validRoles = ["USER", "CREATOR", "TRAINER"];
    if (!validRoles.includes(newRole)) return NR.json({ error: "Rôle invalide" }, { status: 400 });
    const updated = await prismaParametres.user.update({
      where:  { id: user.id },
      data:   { role: newRole, isVerified: false },
      select: { role: true, isVerified: true },
    });
    // Invalider le cache utilisateur
    await inv(`session-user:${session.user.email}`, `user:me:${session.user.email}`);
    return NR.json(updated);
  }

  const data: Record<string, unknown> = {};
  if (displayName !== undefined) data.displayName = displayName;
  if (bio         !== undefined) data.bio         = bio;
  if (location    !== undefined) data.location    = location;
  if (website     !== undefined) data.website     = website;

  if (email !== undefined && email !== session.user.email) {
    const exists = await prismaParametres.user.findUnique({ where: { email } });
    if (exists) return NR.json({ error: "Cet email est déjà utilisé" }, { status: 409 });
    data.email = email;
  }

  const toInt = (v: unknown): number | null =>
    v === "" || v === undefined || v === null ? null : parseInt(String(v), 10);

  if (subscriptionPrice !== undefined) data.subscriptionPrice = toInt(subscriptionPrice);
  if (subscriptionVIP   !== undefined) data.subscriptionVIP   = toInt(subscriptionVIP);
  if (audioCallPrice    !== undefined) data.audioCallPrice    = toInt(audioCallPrice);
  if (videoCallPrice    !== undefined) data.videoCallPrice    = toInt(videoCallPrice);
  if (messagePrice      !== undefined) data.messagePrice      = toInt(messagePrice);

  if (Object.keys(data).length === 0) return NR.json({ error: "Aucune modification" }, { status: 400 });

  const updated = await prismaParametres.user.update({
    where:  { id: user.id },
    data,
    select: {
      displayName: true, email: true, bio: true, location: true, website: true,
      subscriptionPrice: true, subscriptionVIP: true,
      audioCallPrice: true, videoCallPrice: true, messagePrice: true,
    },
  });

  // Invalider tous les caches liés à cet utilisateur
  await inv(
    `session-user:${session.user.email}`,
    `user:me:${session.user.email}`,
    `user:profil:${user.username}`,
  );

  return NR.json(updated);
}