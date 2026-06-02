import { generateId } from "ai";
import { genSaltSync, hashSync } from "bcrypt-ts";

export const AUTH_ROLES = ["user", "guest"] as const;
export type AuthRole = (typeof AUTH_ROLES)[number];

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function generateHashedPassword(password: string) {
  const salt = genSaltSync(10);
  const hash = hashSync(password, salt);

  return hash;
}

export function generateDummyPassword() {
  const password = generateId();
  const hashedPassword = generateHashedPassword(password);

  return hashedPassword;
}
