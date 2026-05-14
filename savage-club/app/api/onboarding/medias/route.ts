// app/api/onboarding/medias/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-compat";
import { prisma } from "@/lib/prisma";
import { MediaType, PostVisibility } from "@prisma/client";
import { randomUUID } from "crypto";

type MediaInput = {
  url:        string;
  type:       "IMAGE" | "VIDEO" | "DOCUMENT";
  visibility: "PUBLIC" | "SUBSCRIBERS" | "PAID";
};

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { medias }: { medias: MediaInput[] } = await req.json();
  if (!Array.isArray(medias) || medias.length === 0)
    return NextResponse.json({ error: "Médias requis" }, { status: 400 });

  let count = 0;
  const now = new Date();

  for (let i = 0; i < medias.length; i++) {
    const m      = medias[i];
    const postId = randomUUID();

    await prisma.post.create({
      data: {
        id:         postId,
        userId:     session.user.id,
        content:    "",
        visibility: m.visibility as PostVisibility,
        updatedAt:  now,
      },
    });

    await prisma.postMedia.create({
      data: {
        id:     randomUUID(),
        postId,
        url:    m.url,
        type:   m.type as MediaType,
        order:  i,
      },
    });

    count++;
  }

  return NextResponse.json({ ok: true, count });
}