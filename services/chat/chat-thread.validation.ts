import { z } from "zod";

export const chatThreadTitleSchema = z
  .string()
  .trim()
  .min(1, "对话标题不能为空")
  .max(120, "对话标题不能超过 120 个字符");

export const createChatThreadSchema = z.object({
  title: chatThreadTitleSchema.optional(),
});

export const updateChatThreadSchema = z
  .object({
    title: chatThreadTitleSchema.optional(),
    isArchived: z.boolean().optional(),
  })
  .refine((value) => value.title !== undefined || value.isArchived !== undefined, {
    message: "至少需要提供一个可更新字段",
  });

export type CreateChatThreadInput = z.infer<typeof createChatThreadSchema>;
export type UpdateChatThreadInput = z.infer<typeof updateChatThreadSchema>;
