import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata = {
  title: "注册",
  description: "简约设计的注册页",
};

export default function RegisterPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f5f1e8] text-zinc-950 font-sans">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at top left, rgba(255,255,255,0.95), transparent 42%), radial-gradient(circle at 85% 18%, rgba(245,158,11,0.16), transparent 28%), linear-gradient(180deg, #faf7f1 0%, #f1ece3 100%)",
        }}
      />
      <div className="absolute left-[-8rem] top-[-8rem] h-80 w-80 rounded-full bg-amber-200/40 blur-3xl" />
      <div className="absolute bottom-[-10rem] right-[-6rem] h-96 w-96 rounded-full bg-zinc-300/35 blur-3xl" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-12 px-6 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-10">
        <section className="order-1 lg:order-2">
          <Card className="mx-auto w-full max-w-md border-black/8 bg-white/80 shadow-[0_28px_90px_-30px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <CardHeader className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-950 text-sm font-semibold text-white shadow-lg">
                    A
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-950">Agent Studio</p>
                    <p className="text-xs text-zinc-500">Create workspace</p>
                  </div>
                </div>
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
                  Beta
                </span>
              </div>

              <div className="pt-2">
                <CardTitle className="text-2xl">创建你的账户</CardTitle>
                {/* <CardDescription className="mt-1"></CardDescription> */}
              </div>
            </CardHeader>

            <CardContent>
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">邮箱</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">密码</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="至少 8 位字符"
                    autoComplete="new-password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">确认密码</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="再次输入密码"
                    autoComplete="new-password"
                  />
                </div>

                <div className="rounded-xl border border-zinc-200/70 bg-zinc-50/80 px-4 py-3">
                  <label className="flex items-start gap-2 text-sm leading-6 text-zinc-600">
                    <input
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

                <Button type="button">创建账户</Button>

                <div className="relative py-2">
                  <div className="absolute inset-x-0 top-1/2 h-px bg-zinc-200" />
                  <div className="relative mx-auto w-fit bg-white/80 px-3 text-xs uppercase tracking-[0.28em] text-zinc-400">
                    or
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="border border-zinc-200/80 bg-white/70"
                  >
                    GitHub
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="border border-zinc-200/80 bg-white/70"
                  >
                    Google
                  </Button>
                </div>

                <p className="text-center text-sm text-zinc-500">
                  已有账户？{" "}
                  <Link href="/login" className="font-medium text-zinc-800 hover:text-zinc-950">
                    去登录
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
