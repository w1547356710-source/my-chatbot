import { createAgent } from "langchain";
import { getWeather, getGeocoding } from "../tools";
import { deepseekModel } from "../models";
import { MemorySaver } from "@langchain/langgraph";
import { dynamicModelSelection, handleToolErrors, weatherStateMiddleware } from "../middleware";

const checkpointer = new MemorySaver();
export const weatherAgent = createAgent({
  model: deepseekModel,
  tools: [getWeather, getGeocoding],
  systemPrompt: "你是一个天气查询ai,只能查询天气相关！",
  middleware: [dynamicModelSelection, handleToolErrors, weatherStateMiddleware],
  checkpointer,
});
