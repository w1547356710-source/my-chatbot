import "server-only";
import { and, asc, count, desc, eq, gt, gte, inArray, lt, type SQL } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { generateHashedPassword } from "./utils";
import { user } from "../schema";
import { ChatbotError } from "../../http/errors";
const client = postgres(process.env.DATABASE_URL ?? "");
const db = drizzle(client);
export async function createUser(email: string, password: string) {
  const hashedPassword = generateHashedPassword(password);
  try {
    return await db.insert(user).values({ email, password: hashedPassword });
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to create user");
  }
}
