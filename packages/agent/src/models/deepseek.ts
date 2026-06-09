import { ChatDeepSeek } from "@langchain/deepseek";

export const deepseekModel = new ChatDeepSeek({
  model: "deepseek-v4-flash",
  apiKey: process.env.DEEPSEEK_API_KEY,
  temperature: 0.5,
  timeout: 30000,
  maxTokens: 25000,
});

export const deepseekProModel = new ChatDeepSeek({
  model: "deepseek-v4-pro",
  apiKey: process.env.DEEPSEEK_API_KEY,
  temperature: 0.5,
  timeout: 30000,
  maxTokens: 25000,
});
