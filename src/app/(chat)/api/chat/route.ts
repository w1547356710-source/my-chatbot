import { agent } from "@lib/langchain/agents/weatherAgent";
import { toBaseMessages, toUIMessageStream } from "@ai-sdk/langchain";
import { createUIMessageStreamResponse, UIMessage, UIMessageChunk } from "ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();
    const langchainMessages = await toBaseMessages(messages);
    const stream = await agent.stream(
      { messages: langchainMessages },
      { streamMode: ["values", "messages"] },
    );
    return createUIMessageStreamResponse({
      stream: toUIMessageStream(stream),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// export async function POST(req: Request) {
//   try {
//     const { messages } = await req.json();
//     console.log(messages);
//     const stream = await agent.streamEvents({ messages }, { version: "v3" });

//     const encoder = new TextEncoder();
//     const readableStream = new ReadableStream({
//       async pull(controller) {
//         for await (const event of stream) {
//           controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
//         }
//         controller.close();
//       },
//     });
//     // return NextResponse.json({ finalState }, { status: 200 });

//     return new Response(readableStream, {
//       headers: {
//         "Content-Type": "text/event-stream",
//       },
//     });
//   } catch (error) {
//     const message = error instanceof Error ? error.message : "An unknown error occurred";
//     return NextResponse.json({ error: message }, { status: 500 });
//   }
// }
