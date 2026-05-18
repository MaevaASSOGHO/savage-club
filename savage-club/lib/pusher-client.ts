// lib/pusher-client.ts
import * as Ably from "ably";

let client: Ably.Realtime | null = null;

export function getAblyClient(userId?: string) {
  if (typeof window === "undefined") return null;

  // Si le client existe déjà avec le bon userId, le retourner
  if (client) return client;

  // Ne pas créer le client sans userId
  if (!userId) return null;

  client = new Ably.Realtime({
    authUrl: `/api/ably/auth`,
    authMethod: "GET",
    clientId: userId,
  });

  return client;
}

// Permet de réinitialiser le client à la déconnexion
export function resetAblyClient() {
  if (client) {
    client.close();
    client = null;
  }
}