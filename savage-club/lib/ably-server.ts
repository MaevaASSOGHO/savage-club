// lib/ably-server.ts 
import * as Ably from "ably";

let client: Ably.Rest | null = null;

function getAblyServer() {
  if (!client) {
    client = new Ably.Rest(process.env.ABLY_API_KEY!);
  }
  return client;
}

export async function triggerPusher(channel: string, event: string, data: object) {
  const ably = getAblyServer();
  await ably.channels.get(channel).publish(event, data);
}