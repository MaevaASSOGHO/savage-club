// lib/pusher.ts
export async function getPusher() {
  // require() au lieu de import() pour éviter le problème CJS/ESM avec Turbopack
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const PusherModule = require("pusher");
  const PusherClass = PusherModule.default || PusherModule;
  
  return new PusherClass({
    appId:   process.env.PUSHER_APP_ID!,
    key:     process.env.PUSHER_KEY!,
    secret:  process.env.PUSHER_SECRET!,
    cluster: process.env.PUSHER_CLUSTER!,
    useTLS:  true,
  });
}