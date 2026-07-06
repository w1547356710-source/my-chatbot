"use client";

import { useEffect, useRef, useState } from "react";
import { useStream } from "@langchain/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { weatherAgent } from "@my-nextjs-agent/agent";

type ToolCallStatus = "running" | "finished" | "error";

type ToolCallLike = {
  name: string;
  callId: string;
  input?: unknown;
  args?: unknown;
  output?: unknown;
  status: ToolCallStatus;
  error?: string;
};

type MessageToolCallRef = {
  id?: string;
};

type MessageLike = {
  id: string;
  type: string;
  text: string;
  tool_calls?: MessageToolCallRef[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function formatJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function ToolCallCard({ toolCall }: { toolCall: ToolCallLike }) {
  if (toolCall.status === "running") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-900">
        <div className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-amber-500" />
          <div>
            <p className="font-semibold">正在调用 {toolCall.name}</p>
            <p className="mt-1 text-xs text-amber-700">参数已发送，等待工具返回结果</p>
          </div>
        </div>
        {toolCall.input ? (
          <pre className="mt-3 overflow-x-auto rounded-xl bg-white/80 p-3 text-xs leading-6 text-slate-700">
            {formatJson(toolCall.input)}
          </pre>
        ) : null}
      </div>
    );
  }

  if (toolCall.status === "error") {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-900">
        <p className="font-semibold">{toolCall.name} 调用失败</p>
        <p className="mt-1 text-xs leading-6 text-red-700">
          {toolCall.error ?? "Tool execution failed"}
        </p>
      </div>
    );
  }

  if (toolCall.name === "get_weather") {
    const input = isRecord(toolCall.input) ? toolCall.input : {};
    const output = isRecord(toolCall.output) ? toolCall.output : {};
    const hourly = isRecord(output.hourly) ? output.hourly : {};
    const temperatures = Array.isArray(hourly.temperature_2m) ? hourly.temperature_2m : [];
    const timeline = Array.isArray(hourly.time) ? hourly.time : [];
    const firstTemperature = temperatures[0];
    const firstTime = timeline[0];

    return (
      <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4 text-sm text-slate-800">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-sky-700 uppercase">
              Weather Tool
            </p>
            <p className="mt-1 font-semibold text-slate-950">已查询天气数据</p>
          </div>
          <div className="rounded-full bg-white px-3 py-1 text-xs text-slate-600 shadow-sm">
            lat {String(input.latitude ?? "-")} / lon {String(input.longitude ?? "-")}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white/90 p-3 shadow-sm">
            <p className="text-xs text-slate-500">首个温度值</p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">
              {typeof firstTemperature === "number" ? `${firstTemperature}°C` : "--"}
            </p>
          </div>
          <div className="rounded-xl bg-white/90 p-3 shadow-sm sm:col-span-2">
            <p className="text-xs text-slate-500">首个时间点</p>
            <p className="mt-1 truncate text-sm font-medium text-slate-800">
              {typeof firstTime === "string" ? firstTime : "暂无时间数据"}
            </p>
          </div>
        </div>

        <pre className="mt-3 overflow-x-auto rounded-xl bg-white/80 p-3 text-xs leading-6 text-slate-700">
          {formatJson(toolCall.output)}
        </pre>
      </div>
    );
  }

  if (toolCall.name === "get_heocoding") {
    const input = isRecord(toolCall.input) ? toolCall.input : {};
    const output = isRecord(toolCall.output) ? toolCall.output : {};
    const results = Array.isArray(output.results) ? output.results : [];
    const firstResult = isRecord(results[0]) ? results[0] : {};

    return (
      <div className="rounded-2xl border border-violet-200 bg-violet-50/80 p-4 text-sm text-slate-800">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-violet-700 uppercase">
              Geocoding Tool
            </p>
            <p className="mt-1 font-semibold text-slate-950">
              已定位 {String(input.city ?? "目标城市")}
            </p>
          </div>
          <div className="rounded-full bg-white px-3 py-1 text-xs text-slate-600 shadow-sm">
            {results.length} 条候选结果
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white/90 p-3 shadow-sm">
            <p className="text-xs text-slate-500">最佳匹配</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">
              {String(firstResult.name ?? "暂无结果")}
            </p>
          </div>
          <div className="rounded-xl bg-white/90 p-3 shadow-sm">
            <p className="text-xs text-slate-500">国家</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">
              {String(firstResult.country ?? "--")}
            </p>
          </div>
          <div className="rounded-xl bg-white/90 p-3 shadow-sm">
            <p className="text-xs text-slate-500">坐标</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">
              {String(firstResult.latitude ?? "--")}, {String(firstResult.longitude ?? "--")}
            </p>
          </div>
        </div>

        <pre className="mt-3 overflow-x-auto rounded-xl bg-white/80 p-3 text-xs leading-6 text-slate-700">
          {formatJson(toolCall.output)}
        </pre>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 text-sm text-slate-800">
      <p className="font-semibold text-slate-950">{toolCall.name}</p>
      <p className="mt-1 text-xs text-slate-500">未定制的工具调用，展示原始数据</p>
      <pre className="mt-3 overflow-x-auto rounded-xl bg-white p-3 text-xs leading-6 text-slate-700">
        {formatJson({
          input: toolCall.input,
          output: toolCall.output,
          status: toolCall.status,
          error: toolCall.error,
        })}
      </pre>
    </div>
  );
}

export default function ChatPage() {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const stream = useStream<typeof weatherAgent>({
    apiUrl: "http://localhost:2024",
    assistantId: "weatherAgent",
  });
  const { messages, isLoading, interrupt, toolCalls } = stream;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  const sendMessage = () => {
    const content = input.trim();
    if (!content || isLoading) return;

    stream.submit({ messages: [{ type: "human" as const, content }] });
    setInput("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  const hasMessages = messages.length > 0;
  const typedMessages = messages as MessageLike[];
  const typedToolCalls = (toolCalls ?? []) as ToolCallLike[];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_32%),linear-gradient(180deg,_#f8fbff_0%,_#eef4ff_45%,_#f8fafc_100%)] px-4 py-6 text-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white/80 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur">
        <header className="border-b border-slate-200/80 px-6 py-5 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <span className="inline-flex w-fit items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium tracking-[0.2em] text-blue-700 uppercase">
                Agent Chat
              </span>
              <div className="space-y-1">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                  和天气助手自然对话
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  支持流式回复与 Markdown 展示，适合查询天气、趋势和出行建议。
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isLoading
                    ? "bg-amber-500 shadow-[0_0_0_6px_rgba(245,158,11,0.14)]"
                    : "bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.14)]"
                }`}
              />
              <div className="text-sm">
                <p className="font-medium text-slate-800">
                  {isLoading ? "正在生成回复" : "助手在线"}
                </p>
                <p className="text-slate-500">
                  {hasMessages ? `共 ${messages.length} 条消息` : "发送一条消息开始对话"}
                </p>
              </div>
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
          {!hasMessages ? (
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-300/90 bg-white/65 px-6 text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-2xl text-white shadow-lg">
                AI
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                开始一次更顺手的聊天
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
                试试输入“北京这周末天气怎么样”或“帮我比较上海和广州今天的体感温度”。
              </p>
            </div>
          ) : (
            <div className="space-y-5 pb-4">
              {typedMessages.map((msg) => {
                const messageToolCalls = typedToolCalls.filter((toolCall) =>
                  msg.tool_calls?.some((messageToolCall) => messageToolCall.id === toolCall.callId),
                );

                return (
                  <div
                    key={msg.id}
                    className={`flex ${msg.type === "human" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-[24px] px-4 py-3 shadow-sm sm:max-w-[75%] ${
                        msg.type === "human"
                          ? "rounded-br-md bg-slate-950 text-white"
                          : "rounded-bl-md border border-slate-200 bg-white text-slate-800"
                      }`}
                    >
                      <p
                        className={`mb-2 text-[11px] font-semibold tracking-[0.18em] uppercase ${
                          msg.type === "human" ? "text-slate-300" : "text-blue-600"
                        }`}
                      >
                        {msg.type === "human" ? "You" : "Assistant"}
                      </p>

                      {msg.type === "ai" ? (
                        <div className="space-y-3">
                          <div className="prose prose-slate max-w-none text-sm leading-7 prose-p:my-2 prose-pre:overflow-x-auto prose-pre:rounded-2xl prose-pre:bg-slate-950 prose-pre:px-4 prose-pre:py-3 prose-code:text-sm prose-strong:text-inherit">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                          </div>
                          {messageToolCalls.length > 0 ? (
                            <div className="space-y-3">
                              {messageToolCalls.map((toolCall) => (
                                <ToolCallCard key={toolCall.callId} toolCall={toolCall} />
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap text-sm leading-7">{msg.text}</p>
                      )}
                    </div>
                  </div>
                );
              })}

              {isLoading ? (
                <div className="flex justify-start">
                  <div className="rounded-[24px] rounded-bl-md border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                    </div>
                  </div>
                </div>
              ) : null}

              <div ref={messagesEndRef} />
            </div>
          )}
        </section>

        <footer className="border-t border-slate-200/80 bg-white/90 px-4 py-4 sm:px-8">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] focus-within:border-blue-400 focus-within:bg-white">
              <textarea
                className="min-h-[96px] w-full resize-none bg-transparent px-4 py-4 text-sm leading-7 text-slate-900 outline-none placeholder:text-slate-400"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="输入天气问题，按 Enter 发送，Shift + Enter 换行"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">回复将实时流式渲染，支持表格、列表和代码块。</p>

              <div className="flex items-center gap-3">
                {isLoading ? (
                  <button
                    type="button"
                    onClick={() => interrupt()}
                    className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
                  >
                    停止生成
                  </button>
                ) : null}
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isLoading ? "生成中..." : "发送消息"}
                </button>
              </div>
            </div>
          </form>
        </footer>
      </div>
    </main>
  );
}
