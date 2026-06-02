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

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = useMemo(
    () => getSafeCallbackUrl(searchParams.get("callbackUrl")),
    [searchParams],
  );
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGuestSubmitting, setIsGuestSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    setIsSubmitting(false);

    if (!result || result.error) {
      setError("邮箱或密码错误");
      return;
    }

    router.replace(result.url ?? callbackUrl);
    router.refresh();
  }

  async function handleGuestSignIn() {
    setError("");
    setIsGuestSubmitting(true);
    await signIn("guest", { callbackUrl });
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
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="password">密码</Label>
          <span className="text-xs font-medium text-zinc-500">暂未启用找回密码</span>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="请输入密码"
          autoComplete="current-password"
          required
        />
      </div>

      <div className="flex items-center justify-between rounded-xl border border-zinc-200/70 bg-zinc-50/80 px-4 py-3">
        <label className="flex items-center gap-2 text-sm text-zinc-600">
          <input
            name="remember"
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-300 text-zinc-950 focus:ring-zinc-300"
          />
          记住我
        </label>
        <span className="text-xs text-zinc-500">当前使用安全会话</span>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting || isGuestSubmitting}>
        {isSubmitting ? "登录中..." : "登录"}
      </Button>

      <div className="relative py-2">
        <div className="absolute inset-x-0 top-1/2 h-px bg-zinc-200" />
        <div className="relative mx-auto w-fit bg-white/80 px-3 text-xs uppercase tracking-[0.28em] text-zinc-400">
          or
        </div>
      </div>

      <Button
        type="button"
        variant="ghost"
        disabled={isSubmitting || isGuestSubmitting}
        onClick={handleGuestSignIn}
        className="border border-zinc-200/80 bg-white/70"
      >
        {isGuestSubmitting ? "正在进入..." : "以游客身份进入"}
      </Button>

      <p className="text-center text-xs leading-6 text-zinc-500">
        继续即表示你同意{" "}
        <Link href="/" className="font-medium text-zinc-700 hover:text-zinc-950">
          服务条款
        </Link>{" "}
        与{" "}
        <Link href="/" className="font-medium text-zinc-700 hover:text-zinc-950">
          隐私政策
        </Link>
      </p>

      <p className="text-center text-sm text-zinc-500">
        还没有账户？{" "}
        <Link href="/register" className="font-medium text-zinc-800 hover:text-zinc-950">
          去注册
        </Link>
      </p>
    </form>
  );
}
