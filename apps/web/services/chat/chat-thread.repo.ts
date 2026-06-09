import { db } from "@lib/db";
import { chatThread, type NewChatThread } from "@lib/db/schema";
import { and, desc, eq } from "drizzle-orm";

export const chatThreadRepo = {
  async createThread(values: Pick<NewChatThread, "userId"> & Partial<NewChatThread>) {
    const [createdThread] = await db.insert(chatThread).values(values).returning();

    return createdThread;
  },

  async listThreadsByUserId(userId: string, options: { includeArchived?: boolean } = {}) {
    const conditions = [eq(chatThread.userId, userId)];

    if (!options.includeArchived) {
      conditions.push(eq(chatThread.isArchived, false));
    }

    return db
      .select()
      .from(chatThread)
      .where(and(...conditions))
      .orderBy(desc(chatThread.updatedAt));
  },

  async findThreadByThreadId(userId: string, threadId: string) {
    const [foundThread] = await db
      .select()
      .from(chatThread)
      .where(and(eq(chatThread.userId, userId), eq(chatThread.threadId, threadId)))
      .limit(1);

    return foundThread ?? null;
  },

  async updateThreadTitle(userId: string, threadId: string, title: string) {
    const [updatedThread] = await db
      .update(chatThread)
      .set({ title, updatedAt: new Date() })
      .where(and(eq(chatThread.userId, userId), eq(chatThread.threadId, threadId)))
      .returning();

    return updatedThread ?? null;
  },

  async updateThreadArchiveState(userId: string, threadId: string, isArchived: boolean) {
    const [updatedThread] = await db
      .update(chatThread)
      .set({ isArchived, updatedAt: new Date() })
      .where(and(eq(chatThread.userId, userId), eq(chatThread.threadId, threadId)))
      .returning();

    return updatedThread ?? null;
  },

  async touchThread(userId: string, threadId: string) {
    const [updatedThread] = await db
      .update(chatThread)
      .set({ updatedAt: new Date() })
      .where(and(eq(chatThread.userId, userId), eq(chatThread.threadId, threadId)))
      .returning();

    return updatedThread ?? null;
  },

  async deleteThread(userId: string, threadId: string) {
    const [deletedThread] = await db
      .delete(chatThread)
      .where(and(eq(chatThread.userId, userId), eq(chatThread.threadId, threadId)))
      .returning();

    return deletedThread ?? null;
  },
};
