// lib/pusher-client.ts
import PusherJS from "pusher-js";

const PusherClient = (PusherJS as any).default ?? PusherJS;

export const pusherClient = new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_KEY!,
  {
    cluster:      process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    authEndpoint: "/api/pusher/auth",
  }
);