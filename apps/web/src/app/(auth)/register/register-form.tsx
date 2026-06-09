"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function getSafeCallbackUrl(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/chat";
  }

  return value;
}

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = useMemo(
    () => getSafeCallbackUrl(searchParams.get("callbackUrl")),
    [searchParams],
  );
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");
    const acceptedTerms = formData.get("acceptedTerms") === "on";

    if (!acceptedTerms) {
      setError("请先同意服务条款与隐私政策");
      setIsSubmitting(false);
      return;
    }

    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, confirmPassword }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      setError(payload?.message ?? "注册失败，请稍后再试");
      setIsSubmitting(false);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    setIsSubmitting(false);

    if (!result || result.error) {
      setError("账户已创建，但自动登录失败，请手动登录");
      return;
    }

    router.replace(result.url ?? callbackUrl);
    router.refresh();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="email">邮箱</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="name@company.com"
          autoComplete="email"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">密码</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="至少 8 位字符"
          autoComplete="new-password"
          minLength={8}
          maxLength={64}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">确认密码</Label>
        <Input
          id="confirm-password"
          name="confirmPassword"
          type="password"
          placeholder="再次输入密码"
          autoComplete="new-password"
          minLength={8}
          maxLength={64}
          required
        />
      </div>

      <div className="rounded-xl border border-zinc-200/70 bg-zinc-50/80 px-4 py-3">
        <label className="flex items-start gap-2 text-sm leading-6 text-zinc-600">
          <input
            name="acceptedTerms"
            type="checkbox"
            className="mt-1 h-4 w-4 shrink-0 rounded border-zinc-300 text-zinc-950 focus:ring-zinc-300"
          />
          <span>
            我同意{" "}
            <Link href="/" className="font-medium text-zinc-700 hover:text-zinc-950">
              服务条款
            </Link>{" "}
            与{" "}
            <Link href="/" className="font-medium text-zinc-700 hover:text-zinc-950">
              隐私政策
            </Link>
          </span>
        </label>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "创建中..." : "创建账户"}
      </Button>

      <p className="text-center text-sm text-zinc-500">
        已有账户？{" "}
        <Link href="/login" className="font-medium text-zinc-800 hover:text-zinc-950">
          去登录
        </Link>
      </p>
    </form>
  );
}
