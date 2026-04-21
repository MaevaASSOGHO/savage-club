// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const API_URL = process.env.API_URL || "http://localhost:3001";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
        name: { label: "Nom", type: "text" },
        mode: { label: "Mode", type: "text" },
      },
      async authorize(credentials) {
        const endpoint =
          credentials?.mode === "register"
            ? `${API_URL}/auth/register`
            : `${API_URL}/auth/login`;

        const body: Record<string, string> = {
          email: credentials?.email ?? "",
          password: credentials?.password ?? "",
        };
        if (credentials?.mode === "register" && credentials?.name) {
          body.name = credentials.name;
        }

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Erreur d'authentification");
        }

        return {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          accessToken: data.token,
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth",
    error: "/auth",
  },
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.accessToken = (user as any).accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.accessToken = token.accessToken;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };