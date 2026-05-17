// lib/ably-server.ts 
import * as Ably from "ably";

let client: Ably.Rest | null = null;

function getAblyServer() {
  if (!client) {
    // Côté serveur : clé API directe, pas d'authUrl
    client = new Ably.Rest({ key: process.env.ABLY_API_KEY! });
  }
  return client;
}

export async function triggerPusher(channel: string, event: string, data: object) {
  const ably = getAblyServer();
  await ably.channels.get(channel).publish(event, data);
}