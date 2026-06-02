import type { DefaultSession, DefaultUser } from "next-auth";
import type { AuthRole } from "../services/auth/user.utils";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: AuthRole;
      isAnonymous: boolean;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: AuthRole;
    isAnonymous: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: AuthRole;
    isAnonymous?: boolean;
  }
}
