import { StateSchema } from "@langchain/langgraph";
import { createMiddleware } from "langchain";
import * as z from "zod";

const ragState = new StateSchema({
  userId: z.string(),
  sessionContext: z.record(z.string(), z.any()),
});

export const ragStateMiddleware = createMiddleware({
  name: "RagStateExtension",
  stateSchema: ragState,
});
