// lib/cache.ts
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const TTL = {
  user:         300,  // profil utilisateur : 5 minutes
  subscription: 120,  // statut d'abonnement : 2 minutes
  collections:  300,  // collections : 5 minutes
};

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const cached = await redis.get<T>(key);
    return cached ?? null;
  } catch {
    return null;
  }
}

export async function setCached(
  key: string,
  value: unknown,
  ttlKey: keyof typeof TTL
) {
  try {
    await redis.set(key, value, { ex: TTL[ttlKey] });
  } catch {
    // silencieux — le cache est un bonus, pas une obligation
  }
}

export async function invalidateCache(...keys: string[]) {
  try {
    await Promise.all(keys.map((key) => redis.del(key)));
  } catch {}
}