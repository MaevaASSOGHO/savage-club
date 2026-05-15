// lib/pusher.ts
import PusherServer from "pusher";

// Contournement compatibilité CJS/ESM avec Turbopack
const PusherClass = (PusherServer as any).default ?? PusherServer;

export const pusher = new PusherClass({
  appId:   process.env.PUSHER_APP_ID!,
  key:     process.env.PUSHER_KEY!,
  secret:  process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS:  true,
});