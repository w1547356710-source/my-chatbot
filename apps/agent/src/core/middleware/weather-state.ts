import { StateSchema } from "@langchain/langgraph";
import { createMiddleware } from "langchain";
import * as z from "zod";

const weatherState = new StateSchema({
  userId: z.string(),
  preferences: z.record(z.string(), z.any()),
});

export const weatherStateMiddleware = createMiddleware({
  name: "StateExtension",
  stateSchema: weatherState,
});
