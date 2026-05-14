// app/api/onboarding/medias/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-compat";
import { prisma } from "@/lib/prisma";

type MediaInput = {
  url:        string;
  type:       "IMAGE" | "VIDEO";
  visibility: "PUBLIC" | "SUBSCRIBERS" | "PAID";
};

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { medias }: { medias: MediaInput[] } = await req.json();
  if (!Array.isArray(medias) || medias.length === 0)
    return NextResponse.json({ error: "Médias requis" }, { status: 400 });

  // Créer un post par média (même structure que le reste de l'app)
  const created = await Promise.all(
    medias.map((m, i) =>
      prisma.post.create({
        data: {
          userId:     session.user.id,
          content:    "",
          visibility: m.visibility,
          PostMedia: {
            create: {
              url:   m.url,
              type:  m.type,
              order: i,
            },
          },
        },
      })
    )
  );

  return NextResponse.json({ ok: true, count: created.length });
}
