// app/api/ably/auth/route.ts
import { NextResponse } from "next/server";
import * as Ably from "ably";
import { getSessionUserId } from "@/lib/get-session-user";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const client = new Ably.Rest(process.env.ABLY_API_KEY!);
  const tokenRequest = await client.auth.createTokenRequest({
    clientId: userId,
    capability: {
      [`private-user-${userId}`]: ["subscribe"],
    },
    ttl: 3600 * 1000,
  });

  return NextResponse.json(tokenRequest);
}