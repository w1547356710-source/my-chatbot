import { agent } from "@lib/langchain/agents/weatherAgent";
import { toBaseMessages, toUIMessageStream } from "@ai-sdk/langchain";
import { createUIMessageStreamResponse, UIMessage } from "ai";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();
    const langchainMessages = await toBaseMessages(messages);
    const myThreadId = uuidv4();
    const stream = agent.streamEvents(
      { messages: langchainMessages },
      {
        streamMode: ["values", "messages"],
        configurable: {
          thread_id: myThreadId,
        },
      },
    );
    return createUIMessageStreamResponse({
      stream: toUIMessageStream(stream),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
