// lib/auth-compat.ts
// Shim de compatibilité next-auth v4 → v5
// Permet d'utiliser getServerSession(authOptions) sans modifier tous les fichiers
import { auth } from "@/auth";

export const authOptions = {};

export async function getServerSession(_options?: any) {
  return await auth();
}
