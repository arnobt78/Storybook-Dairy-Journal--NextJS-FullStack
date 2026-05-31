import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/db";
import { getGoogleOAuthEnv } from "@/lib/auth/google-oauth-env";
import { provisionOAuthUser } from "@/lib/auth/provision-oauth-user";
import bcrypt from "bcryptjs";
import type { NextAuthConfig } from "next-auth";

const googleOAuth = getGoogleOAuthEnv();

export const authConfig: NextAuthConfig = {
  providers: [
    ...(googleOAuth.enabled && googleOAuth.clientId && googleOAuth.clientSecret
      ? [
          Google({
            clientId: googleOAuth.clientId,
            clientSecret: googleOAuth.clientSecret,
          }),
        ]
      : []),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user?.passwordHash) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.displayName ?? user.email.split("@")[0],
          image: user.avatarUrl ?? null,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google" || !user.email) {
        return true;
      }

      try {
        const googleProfile = profile as
          | { name?: string; picture?: string; email_verified?: boolean }
          | undefined;

        const dbUser = await provisionOAuthUser({
          email: user.email,
          displayName: user.name ?? googleProfile?.name ?? null,
          avatarUrl: user.image ?? googleProfile?.picture ?? null,
        });

        user.id = dbUser.id;
        user.name = dbUser.displayName ?? user.name;
        user.image = dbUser.avatarUrl ?? user.image;
        return true;
      } catch {
        return false;
      }
    },
    jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      if (user?.image) token.picture = user.image;
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      if (token.picture && session.user) {
        session.user.image = token.picture as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  trustHost: true,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
