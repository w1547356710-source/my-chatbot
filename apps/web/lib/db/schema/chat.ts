import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { boolean, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { user } from "./auth";

export const chatThread = pgTable(
  "ChatThread",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    threadId: uuid("threadId").notNull().defaultRandom().unique(),
    title: text("title").notNull().default("新对话"),
    isArchived: boolean("isArchived").notNull().default(false),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => [index("ChatThread_userId_updatedAt_idx").on(table.userId, table.updatedAt)],
);

export type ChatThread = InferSelectModel<typeof chatThread>;
export type NewChatThread = InferInsertModel<typeof chatThread>;
