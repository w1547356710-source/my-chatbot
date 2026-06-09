import { db } from "@lib/db";
import { user } from "@lib/db/schema/auth";
import { eq } from "drizzle-orm";

import { generateDummyPassword, generateHashedPassword, normalizeEmail } from "./user.utils";

export const userRepo = {
  async createUser(email: string, password: string) {
    const hashedPassword = generateHashedPassword(password);

    const [createdUser] = await db
      .insert(user)
      .values({ email: normalizeEmail(email), password: hashedPassword, isAnonymous: false })
      .returning();

    return createdUser;
  },

  async createGuestUser() {
    const [createdUser] = await db
      .insert(user)
      .values({
        email: `${crypto.randomUUID()}@guest.local`,
        password: generateDummyPassword(),
        name: "Guest",
        isAnonymous: true,
      })
      .returning();

    return createdUser;
  },

  async findByEmail(email: string) {
    const [foundUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, normalizeEmail(email)))
      .limit(1);

    return foundUser ?? null;
  },
};
