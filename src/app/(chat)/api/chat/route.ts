import { agent } from "@lib/langchain/agents/weatherAgent";
import { toBaseMessages, toUIMessageStream } from "@ai-sdk/langchain";
import { createUIMessageStreamResponse, UIMessage } from "ai";
import { auth } from "@/app/(auth)/auth";
import { createRouteHandler, denyIf, fail, requireAuth } from "@lib/db/utils";

type ChatBody = {
  messages: UIMessage[];
};

export const POST = createRouteHandler<ChatBody, { session?: Awaited<ReturnType<typeof auth>> }>({
  parseBody: async (req) => {
    const body = (await req.json()) as Partial<ChatBody>;
    if (!Array.isArray(body.messages)) {
      throw new Error("messages must be an array");
    }

    return { messages: body.messages };
  },
  onError: (err) => {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return fail(message, message === "messages must be an array" ? 400 : 500);
  },
  middlewares: [
    requireAuth({
      getSession: async () => auth(),
    }),
    denyIf({
      when: (ctx) => ctx.body.messages.length > 50,
      message: "Too many messages in one request",
      statusCode: 429,
    }),
  ],
  handler: async ({ body }) => {
    const langchainMessages = await toBaseMessages(body.messages);
    const stream = await agent.stream(
      { messages: langchainMessages },
      { streamMode: ["values", "messages"] },
    );

    return createUIMessageStreamResponse({
      stream: toUIMessageStream(stream),
    });
  },
});
