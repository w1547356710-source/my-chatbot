import { compare } from "bcrypt-ts";
import NextAuth from "next-auth";
import NeonAdapter from "@auth/neon-adapter";
import { Pool } from "@neondatabase/serverless";
import Credentials from "next-auth/providers/credentials";
import type { Provider } from "next-auth/providers";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const providers: Provider[] = [
  Credentials({
    credentials: {
      email: {
        type: "email",
        label: "Email",
        placeholder: "请输入邮箱",
      },
      password: { label: "Password", type: "password", placeholder: "请输入密码" },
    },
    async authorize(credentials) {
      const email = String(credentials.email ?? "");
      const password = String(credentials.password ?? "");
      const users = await getUser(email);
    },
  }),
];

//   export const providerMap = providers
//     .map((provider) => {
//       if (typeof provider === "function") {
//         const providerData = provider()
//         return { id: providerData.id, name: providerData.name }
//       } else {
//         return { id: provider.id, name: provider.name }
//       }
//     })
//     .filter((provider) => provider.id !== "credentials")
export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: NeonAdapter(pool),
  providers: [],
});
