"use client";

import { useState } from "react";
import { useStream } from "@langchain/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { agent } from "@lib/langchain/agents/weatherAgent";
export default function ChatPage() {
  const [input, setInput] = useState("");

  // 1. 初始化流式连接
  const stream = useStream<typeof agent>({
    // apiUrl: "http://localhost:3000/api",
    assistantId: "agent",
  });
  const { messages, isLoading, interrupt } = stream;
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(input);
    if (!input.trim()) return;
    // 2. 发送消息到 Agent
    stream.submit({ messages: [{ type: "human" as const, content: input }] });
    setInput("");
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      {/* 消息列表 */}
      <div className="space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={msg.type === "human" ? "text-right" : "text-left"}>
            <div
              className={`inline-block p-3 rounded-lg ${msg.type === "human" ? "bg-blue-500 text-white" : "bg-gray-100"}`}
            >
              {msg.type === "ai" ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
              ) : (
                <p>{msg.text}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 输入框 */}
      <form onSubmit={handleSubmit} className="fixed bottom-4 w-full max-w-2xl flex gap-2">
        <input
          className="flex-1 border p-2 rounded"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="请输入消息..."
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          发送
        </button>
      </form>
    </div>
  );
}
