// lib/auth-compat.ts
import { auth } from "@/auth";

export const authOptions = {};

export async function getServerSession(_options?: any) {
  const session = await auth();
  if (!session) return null;
  
  // Normaliser pour ressembler à la v4
  return {
    user: {
      id:          (session.user as any)?.id,
      email:       session.user?.email,
      name:        session.user?.name,
      image:       session.user?.image,
      accessToken: (session.user as any)?.accessToken,
    },
    expires: session.expires,
  };
}