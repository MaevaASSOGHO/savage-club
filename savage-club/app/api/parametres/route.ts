import { getServerSession, authOptions } from "@/lib/auth-compat";
// app/api/parametres/route.ts
import { prisma } from "@/lib/prisma";


import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const body = await req.json();
  const {
    action,
    // Infos personnelles
    displayName, email, bio, location, website,
    // Mot de passe
    currentPassword, newPassword,
    // Prix abonnements
    subscriptionPrice, subscriptionVIP,
    // Prix communications
    audioCallPrice, videoCallPrice, messagePrice,
    // Changement de rôle
    newRole,
    // Identité
    idDocumentUrl,
  } = body;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, password: true, role: true },
  });
  if (!user) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  // ── Changement de mot de passe ──────────────────────────────────
  if (action === "change_password") {
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 400 });
    }
    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: "Le nouveau mot de passe doit faire au moins 8 caractères" }, { status: 400 });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
    return NextResponse.json({ success: true });
  }

  // ── Changement de rôle ──────────────────────────────────────────
  if (action === "change_role") {
    const validRoles = ["USER", "CREATOR", "TRAINER"];
    if (!validRoles.includes(newRole)) {
      return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
    }
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { role: newRole, isVerified: false },
      select: { role: true, isVerified: true },
    });
    return NextResponse.json(updated);
  }


  // ── Mise à jour générale (infos + prix) ─────────────────────────
  const data: Record<string, unknown> = {};

  if (displayName !== undefined) data.displayName = displayName;
  if (bio         !== undefined) data.bio         = bio;
  if (location    !== undefined) data.location    = location;
  if (website     !== undefined) data.website     = website;

  // Email : vérifier unicité si changement
  if (email !== undefined && email !== session.user.email) {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 });
    data.email = email;
  }

  // Convertit string vide → null, sinon parseInt
  const toInt = (v: unknown): number | null =>
    v === "" || v === undefined || v === null ? null : parseInt(String(v), 10);

  if (subscriptionPrice !== undefined) data.subscriptionPrice = toInt(subscriptionPrice);
  if (subscriptionVIP   !== undefined) data.subscriptionVIP   = toInt(subscriptionVIP);
  if (audioCallPrice    !== undefined) data.audioCallPrice    = toInt(audioCallPrice);
  if (videoCallPrice    !== undefined) data.videoCallPrice    = toInt(videoCallPrice);
  if (messagePrice      !== undefined) data.messagePrice      = toInt(messagePrice);

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Aucune modification" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data,
    select: {
      displayName: true, email: true, bio: true,
      location: true, website: true,
      subscriptionPrice: true, subscriptionVIP: true,
      audioCallPrice: true, videoCallPrice: true, messagePrice: true,
    },
  });

  return NextResponse.json(updated);
}
