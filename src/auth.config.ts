import type { NextAuthConfig } from "next-auth";

// Edge-safe config: no Node-only deps (no bcrypt, no DB driver).
// The middleware imports this; the full config in auth.ts adds the
// Credentials provider which does the actual password check.
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.id = (user as { id: string }).id;
      }
      return token;
    },
    session: ({ session, token }) => {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
