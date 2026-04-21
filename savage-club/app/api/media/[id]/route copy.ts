// app/api/media/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import fs from "fs";
import path from "path";

export async function GET(req: Request, { params }: { params: { postId: string } }) {
  try {
    const session = await getServerSession(authOptions);

    // 🔐 1. Vérifier utilisateur
    if (!session || !(session.user as any)?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const userId = (session.user as any).id;

    // 🔎 2. Récupérer le post + média
    const post = await prisma.post.findUnique({
      where: { id: params.postId },
      include: {
        PostMedia: true,
        User: true
      }
    });

    if (!post || !post.PostMedia.length) {
      return new Response("Media not found", { status: 404 });
    }

    // 🔒 3. Vérifier accès (IMPORTANT)
    const hasAccess =
      !post.isLocked || // gratuit
      post.userId === userId || // propriétaire
      (await prisma.subscription.findFirst({
        where: {
          creatorId: post.userId,
          subscriberId: userId,
          status: "ACTIVE"
        }
      }));

    if (!hasAccess) {
      return new Response("Forbidden", { status: 403 });
    }

    // 📁 4. Charger le fichier local
    const filePath = path.join(process.cwd(), "public", post.PostMedia[0].url);

    if (!fs.existsSync(filePath)) {
      return new Response("File not found", { status: 404 });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;

    const range = req.headers.get("range");

    // 🎬 5. STREAMING (ultra important)
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      const chunkSize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });

      return new Response(file as any, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize.toString(),
          "Content-Type": "video/mp4",
        },
      });
    }

    // fallback
    const file = fs.createReadStream(filePath);

    return new Response(file as any, {
      headers: {
        "Content-Length": fileSize.toString(),
        "Content-Type": "video/mp4",
      },
    });

  } catch (error) {
    console.error(error);
    return new Response("Server error", { status: 500 });
  }
}