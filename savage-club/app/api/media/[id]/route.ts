import { getServerSession, authOptions } from "@/lib/auth-compat";
import { prisma } from "@/lib/prisma";


import fs from "fs";
import path from "path";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } // ✅ IMPORTANT
) {
  try {
    const { id } = await context.params; // ✅ IMPORTANT

    const session = await getServerSession(authOptions);

    // 🔐 1. Vérifier utilisateur
    if (!session || !(session.user as any)?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const userId = (session.user as any).id;

    // 🔎 2. Récupérer le post + média
    const post = await prisma.post.findUnique({
      where: { id }, // ✅ FIX
      include: {
        PostMedia: true,
        User: true
      }
    });

    if (!post || !post.PostMedia.length) {
      return new Response("Media not found", { status: 404 });
    }

    // 🔒 3. Vérifier accès
    const hasAccess =
      !post.isLocked ||
      post.userId === userId ||
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

    // 📁 4. Charger le fichier
    const filePath = path.join(process.cwd(), "public", post.PostMedia[0].url);

    if (!fs.existsSync(filePath)) {
      return new Response("File not found", { status: 404 });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;

    const range = req.headers.get("range");

    // 🎬 STREAMING
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