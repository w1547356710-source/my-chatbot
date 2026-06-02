import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getServerSession } from "next-auth/next";

import {
  createGuestUser,
  authenticateUser,
  toSessionUser,
} from "../../../services/auth/user.service";
import { loginSchema } from "../../../services/auth/user.validation";

import { authConfig } from "./auth.config";

const authSecret =
  process.env.NEXTAUTH_SECRET ??
  process.env.AUTH_SECRET ??
  (process.env.NODE_ENV === "production" ? undefined : "development-secret");

export const authOptions: NextAuthOptions = {
  ...authConfig,
  session: {
    strategy: "jwt",
  },
  secret: authSecret,
  providers: [
    Credentials({
      id: "credentials",
      name: "Email",
      credentials: {
        email: {
          type: "email",
          label: "Email",
          placeholder: "请输入邮箱",
        },
        password: { label: "Password", type: "password", placeholder: "请输入密码" },
      },
      async authorize(credentials) {
        const parsedCredentials = loginSchema.safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const user = await authenticateUser(
          parsedCredentials.data.email,
          parsedCredentials.data.password,
        );

        return user ? toSessionUser(user) : null;
      },
    }),
    Credentials({
      id: "guest",
      name: "Guest",
      credentials: {},
      async authorize() {
        const user = await createGuestUser();

        return toSessionUser(user);
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.isAnonymous = user.isAnonymous;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? "";
        session.user.role = token.role ?? "guest";
        session.user.isAnonymous = token.isAnonymous ?? session.user.role === "guest";
      }

      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

export function getCurrentSession() {
  return getServerSession(authOptions);
}
