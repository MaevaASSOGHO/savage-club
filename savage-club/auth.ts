// auth.ts
import NextAuth from "next-auth/next";
import Credentials from "next-auth/providers/credentials";

const API_URL = process.env.API_URL || "http://localhost:3001";
const NextAuth = require("next-auth").default;

const result = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email:    { label: "Email",        type: "email" },
        password: { label: "Mot de passe", type: "password" },
        name:     { label: "Nom",          type: "text" },
        mode:     { label: "Mode",         type: "text" },
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
    jwt({ token, user }: any) {
      if (user) {
        token.id          = user.id;
        token.accessToken = user.accessToken;
      }
      return token;
    },
    session({ session, token }: any) {
      if (session.user) {
        session.user.id          = token.id;
        session.user.accessToken = token.accessToken;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export const { auth, handlers } = result;
export default result;
