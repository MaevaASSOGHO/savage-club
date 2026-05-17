// lib/pusher-client.ts
import * as Ably from "ably";

let client: Ably.Realtime | null = null;

export function getAblyClient() {
  if (typeof window === "undefined") return null;

  if (!client) {
    client = new Ably.Realtime({
      authUrl: "/api/ably/auth",
      authMethod: "GET",
      logLevel: 2, // active les logs Ably en dev
    });
  }
  return client;
}