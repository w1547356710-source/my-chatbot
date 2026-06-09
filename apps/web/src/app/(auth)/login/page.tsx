import { Suspense } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { LoginForm } from "./login-form";

export const metadata = {
  title: "登录",
  description: "简约设计的登录页",
};

export default function LoginPage() {
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
                    <p className="text-xs text-zinc-500">Secure access</p>
                  </div>
                </div>
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
                  Beta
                </span>
              </div>

              <div className="pt-2">
                <CardTitle className="text-2xl">登录你的账户</CardTitle>
              </div>
            </CardHeader>

            <CardContent>
              <Suspense fallback={null}>
                <LoginForm />
              </Suspense>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
