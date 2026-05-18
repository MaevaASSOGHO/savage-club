import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username")?.trim().toLowerCase();

  if (!username) return NextResponse.json({ available: false });

  const regex = /^[a-zA-Z0-9_]{3,30}$/;
  if (!regex.test(username)) {
    return NextResponse.json({ available: false, error: "3–30 caractères, lettres/chiffres/underscore uniquement" });
  }

  const existing = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  return NextResponse.json({ available: !existing });
}