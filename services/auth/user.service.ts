import { compare } from "bcrypt-ts";

import type { User } from "@lib/db/schema";

import { userRepo } from "./user.repo";
import type { AuthRole } from "./user.utils";
import { normalizeEmail } from "./user.utils";

export async function createUser(email: string, password: string) {
  const existingUser = await userRepo.findByEmail(email);

  if (existingUser) {
    throw new AuthServiceError("USER_EXISTS", "该邮箱已注册");
  }

  return userRepo.createUser(email, password);
}

export async function createGuestUser() {
  return userRepo.createGuestUser();
}

export async function authenticateUser(email: string, password: string) {
  const foundUser = await userRepo.findByEmail(email);

  if (!foundUser?.password || foundUser.isAnonymous) {
    return null;
  }

  const isValidPassword = await compare(password, foundUser.password);

  if (!isValidPassword) {
    return null;
  }

  return foundUser;
}

export function toSessionUser(user: User) {
  return {
    id: user.id,
    email: normalizeEmail(user.email),
    name: user.name,
    image: user.image,
    isAnonymous: user.isAnonymous,
    role: getUserRole(user),
  };
}

export function getUserRole(user: Pick<User, "isAnonymous">): AuthRole {
  return user.isAnonymous ? "guest" : "user";
}

export class AuthServiceError extends Error {
  constructor(
    public code: "USER_EXISTS" | "INVALID_CREDENTIALS" | "INVALID_INPUT",
    message: string,
  ) {
    super(message);
    this.name = "AuthServiceError";
  }
}
