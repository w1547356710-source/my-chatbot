"use client";

import { useChat } from "@ai-sdk/react";
import { useLayoutEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const suggestions = ["今天杭州天气怎么样？", "测试"];

export default function Chat() {
  const [input, setInput] = useState("");
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { error, messages, sendMessage, status, stop } = useChat();
  const isBusy = status === "submitted" || status === "streaming";

  useLayoutEffect(() => {
    const messagesContainer = messagesContainerRef.current;

    if (!messagesContainer) {
      return;
    }

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }, [error, messages, status]);

  const submitMessage = (text: string) => {
    const nextMessage = text.trim();

    if (!nextMessage || isBusy) {
      return;
    }

    sendMessage({ text: nextMessage });
    setInput("");
  };

  return (
    <main className="h-dvh overflow-hidden bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto flex h-full w-full max-w-5xl flex-col px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <header className="mb-4 flex shrink-0 items-center justify-between gap-4 sm:mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-950 text-sm font-semibold text-white shadow-sm dark:bg-white dark:text-zinc-950">
              AI
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">ChatRobot</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">智能助手</p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {isBusy ? "正在回复" : "在线"}
          </div>
        </header>

        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <CardHeader className="shrink-0 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800 sm:px-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">对话</CardTitle>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  输入问题后按 Enter 发送
                </p>
              </div>
              {isBusy ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={stop}
                  className="h-9 !w-auto rounded-lg border border-zinc-200 px-3 dark:border-zinc-800"
                >
                  停止
                </Button>
              ) : null}
            </div>
          </CardHeader>

          <CardContent className="flex min-h-0 flex-1 flex-col px-0 pb-0">
            <div
              ref={messagesContainerRef}
              className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-5"
            >
              {messages.length === 0 ? (
                <section className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-base font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                    AI
                  </div>
                  <h2 className="text-xl font-semibold tracking-tight">开始一次对话</h2>
                  <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                    你可以向ChatRobot询问天气。
                  </p>
                  <div className="mt-6 grid w-full gap-2 sm:grid-cols-3">
                    {suggestions.map((suggestion) => (
                      <Button
                        key={suggestion}
                        type="button"
                        variant="ghost"
                        onClick={() => submitMessage(suggestion)}
                        className="h-auto min-h-11 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-left text-xs leading-5 text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </section>
              ) : (
                messages.map((message) => {
                  const isUser = message.role === "user";

                  return (
                    <article
                      key={message.id}
                      className={["flex gap-3", isUser ? "justify-end" : "justify-start"]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {!isUser ? (
                        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-950 text-[11px] font-semibold text-white dark:bg-white dark:text-zinc-950">
                          AI
                        </div>
                      ) : null}

                      <div
                        className={[
                          "max-w-[82%] rounded-lg px-4 py-3 text-sm leading-6 shadow-sm",
                          isUser
                            ? "bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950"
                            : "border border-zinc-200 bg-zinc-50 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        <div className="mb-1 text-xs font-medium opacity-70">
                          {isUser ? "你" : "ChatRobot"}
                        </div>
                        <div className="whitespace-pre-wrap break-words">
                          {message.parts.map((part, index) => {
                            if (part.type === "text") {
                              return <p key={`${message.id}-${index}`}>{part.text}</p>;
                            }

                            return null;
                          })}
                        </div>
                      </div>
                    </article>
                  );
                })
              )}

              {isBusy ? (
                <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                  ChatRobot 正在思考
                </div>
              ) : null}

              {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                  {error.message}
                </div>
              ) : null}
            </div>

            <form
              className="shrink-0 border-t border-zinc-100 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900 sm:p-4"
              onSubmit={(event) => {
                event.preventDefault();
                submitMessage(input);
              }}
            >
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                <Input
                  value={input}
                  placeholder="输入消息..."
                  disabled={isBusy}
                  className="min-w-0 rounded-lg"
                  onChange={(event) => setInput(event.currentTarget.value)}
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || isBusy}
                  className="h-11 !w-auto shrink-0 rounded-lg px-5"
                >
                  发送
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
