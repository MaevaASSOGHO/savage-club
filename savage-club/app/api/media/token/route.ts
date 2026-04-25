import { getServerSession, authOptions } from "@/lib/auth-compat";


import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const { postId } = await req.json();

  const ip =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const userAgent = req.headers.get("user-agent") || "";

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { id: true },
  });
  if (!user) return new Response("User not found", { status: 404 });

  const raw = `${user.id}-${postId}-${Date.now()}-${Math.random()}`;
  const token = crypto.createHash("sha256").update(raw).digest("hex").slice(0, 12);

  await prisma.mediaView.create({
    data: {
      id: crypto.randomUUID(),
      userId: user.id,
      postId,
      token,
      ip,
      userAgent,
    },
  });

  return Response.json({ token });
}