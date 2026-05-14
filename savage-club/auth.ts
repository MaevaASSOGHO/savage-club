// auth.ts
import Credentials from "next-auth/providers/credentials";
import * as NextAuthModule from "next-auth";
import { prisma } from "@/lib/prisma";

const NextAuth = (NextAuthModule as any).default ?? NextAuthModule;

const API_URL = process.env.API_URL || "http://localhost:3001";

const result = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email:    { label: "Email",        type: "email"    },
        password: { label: "Mot de passe", type: "password" },
        name:     { label: "Nom",          type: "text"     },
        mode:     { label: "Mode",         type: "text"     },
      },
      async authorize(credentials) {
        const mode  = (credentials?.mode     ?? "") as string;
        const email = (credentials?.email    ?? "") as string;
        const pass  = (credentials?.password ?? "") as string;
        const name  = (credentials?.name     ?? "") as string;

        const endpoint = mode === "register"
          ? `${API_URL}/auth/register`
          : `${API_URL}/auth/login`;

        const body: Record<string, unknown> = { email, password: pass };
        if (mode === "register" && name) body.name = name;

        const res  = await fetch(endpoint, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(body),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur d'authentification");

        return {
          id:          data.user.id,
          name:        data.user.name,
          email:       data.user.email,
          accessToken: data.token,
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth",
    error:  "/auth",
  },
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, trigger, session: updatedSession }: any) {
      // ── Premier login : stocker id + accessToken ──────────────────────────
      if (user) {
        token.id          = user.id;
        token.accessToken = user.accessToken;
      }

      // ── Charger role / onboardingStep / username depuis Prisma ────────────
      // Déclenché si l'un des champs est absent du token :
      // - premier login (token vierge)
      // - tokens existants créés avant l'ajout de ces champs
      // Sans ce bloc, onboardingStep = undefined → 0 < maxStep → boucle infinie
      const userId = token.id ?? user?.id;
      if (userId && (token.role === undefined || token.onboardingStep === undefined)) {
        const dbUser = await prisma.user.findUnique({
          where:  { id: userId },
          select: { role: true, onboardingStep: true, username: true },
        });
        token.role           = dbUser?.role           ?? "USER";
        token.onboardingStep = dbUser?.onboardingStep ?? 0;
        token.username       = dbUser?.username       ?? null;
      }

      // ── Mise à jour manuelle via update() côté client ────────────────────
      // Appelé depuis la page onboarding : await update({ onboardingStep: n })
      if (trigger === "update" && updatedSession?.onboardingStep !== undefined) {
        token.onboardingStep = updatedSession.onboardingStep;
      }

      return token;
    },

    session({ session, token }: any) {
      if (session.user) {
        session.user.id             = token.id;
        session.user.accessToken    = token.accessToken;
        session.user.role           = token.role           ?? "USER";
        session.user.onboardingStep = token.onboardingStep ?? 0;
        session.user.username       = token.username       ?? null;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export const { auth, handlers } = result;
export default result;