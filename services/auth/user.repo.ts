import { db } from "@lib/db";
import { user } from "@lib/db/schema/auth";
import { generateHashedPassword } from "./user.utils";
import { eq } from "drizzle-orm";
export const userRepo = {
  createUser(email: string, password: string) {
    const hashedPassword = generateHashedPassword(password);
    return db.insert(user).values({ email, password: hashedPassword });
  },

  findByEmail(email: string) {
    return db.select().from(user).where(eq(user.email, email));
  },
};
