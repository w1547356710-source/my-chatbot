import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";

// 假设 messages 是 useChat 钩子返回的 Message[]
export function convertToLangChainMessages(messages: any[]) {
  return messages.map((msg) => {
    switch (msg.role) {
      case "user":
        return new HumanMessage(msg.parts);
      case "assistant":
        return new AIMessage(msg.parts);
      case "system":
        return new SystemMessage(msg.parts);
      default:
        throw new Error(`Unsupported role: ${msg.role}`);
    }
  });
}