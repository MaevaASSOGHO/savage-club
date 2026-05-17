// lib/pusher-client.ts
import * as Ably from "ably";

let client: Ably.Realtime | null = null;

export function getAblyClient() {
  if (typeof window === "undefined") return null; // SSR — ne rien faire
  
  if (!client) {
    client = new Ably.Realtime({
      authUrl: "/api/ably/auth",
    });
  }
  return client;
}