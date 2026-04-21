// app/api/upload/route.ts
// Sauvegarde les fichiers dans public/uploads (solution locale sans service externe)
import { writeFile, mkdir } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "Aucun fichier reçu" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Créer le dossier public/uploads s'il n'existe pas
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  // Nom unique pour éviter les collisions
  const ext = file.name.split(".").pop();
  const filename = `${randomUUID()}.${ext}`;
  const filepath = path.join(uploadDir, filename);

  await writeFile(filepath, buffer);

  // Retourner l'URL publique accessible depuis le navigateur
  const url = `/uploads/${filename}`;
  return NextResponse.json({ url });
}
