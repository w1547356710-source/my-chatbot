import { ChatDeepSeek } from "@langchain/deepseek";
import { getEnv } from "@my-nextjs-agent/config";
export const deepseekModel = new ChatDeepSeek({
  model: "deepseek-chat",
  apiKey: getEnv("DEEPSEEK_API_KEY"),
  temperature: 0,
  timeout: 30000,
  maxTokens: 25000,
});
// export const deepseekModel = new ChatDeepSeek({
//   model: "deepseek-v4-flash",
//   apiKey: process.env.DEEPSEEK_API_KEY,
//   temperature: 0,
//   timeout: 30000,
//   maxTokens: 25000,
// });

export const deepseekProModel = new ChatDeepSeek({
  model: "deepseek-v4-pro",
  apiKey: getEnv("DEEPSEEK_API_KEY"),
  temperature: 0.5,
  timeout: 30000,
  maxTokens: 25000,
});
