import { agent } from "@lib/langchain/agents/weatherAgent";
import { convertToLangChainMessages } from "@lib/utils";
import { createUIMessageStreamResponse } from 'ai'

function toAssistantText(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }
        if (item && typeof item === "object" && "type" in item && "text" in item) {
          const typed = item as { type?: unknown; text?: unknown };
          if (typed.type === "text" && typeof typed.text === "string") {
            return typed.text;
          }
        }
        return "";
      })
      .join("\n")
      .trim();
  }

  return "";
}

export async function POST(req: Request) {
  const { messages } = await req.json();
  console.log(messages)
  const langchainMessages = convertToLangChainMessages(messages);

  const response = await agent.invoke({ messages: langchainMessages });
  console.log(response)
  // const latestMessage = response.messages.at(-1);
  // const text = toAssistantText(latestMessage?.content);
  // console.log(text)
  // return Response.json({
  //   role: "user",
  //   content: [{ type: "text", text }],
  // });
  // const stream = await agent.stream(messages)
  return {}
}
