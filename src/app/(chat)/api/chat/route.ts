import { agent } from "@lib/langchain/agents/weatherAgent";
import { toBaseMessages, toUIMessageStream, } from '@ai-sdk/langchain';
import {
  createUIMessageStreamResponse,
  UIMessage
} from "ai";

export async function POST(req: Request) {
  const { messages }: { messages:UIMessage[]} = await req.json();
  const langchainMessages = await toBaseMessages(messages);
  const stream = await agent.stream( 
    { messages: langchainMessages },
    { streamMode: ['values', 'messages'] },
  );
  return createUIMessageStreamResponse({
    stream: toUIMessageStream(stream),
  });
}
