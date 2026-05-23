import { createAgent, createMiddleware } from "langchain";
import { getWeather, search } from '../tools'
import { deepseekModel, deepseekProModel } from "../models";

//动态模型
const dynamicModelSelection = createMiddleware({
  name: "DynamicModelSelection",
  wrapModelCall: (request, handler) => {
    const messageCount = request.messages.length;

    return handler({
        ...request,
        model: messageCount > 10 ? deepseekProModel : deepseekModel,
    });
  },
});

export const agent = createAgent({
  model: deepseekModel,
  tools: [getWeather, search],
  middleware: [dynamicModelSelection],
});



//ESLint version 9.39.4 supports flat config without experimental opt-in. The 'eslint.experimental.useFlatConfig' setting can be removed.