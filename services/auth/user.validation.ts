import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .email("请输入有效邮箱")
  .max(64, "邮箱不能超过 64 个字符");

export const passwordSchema = z.string().min(8, "密码至少 8 位").max(64, "密码不能超过 64 位");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "请输入密码").max(64, "密码不能超过 64 位"),
});

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
