import { createAgent, createMiddleware, ToolMessage } from "langchain";
import { getWeather } from "../tools";
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
const handleToolErrors = createMiddleware({
  name: "HandleToolErrors",
  wrapToolCall: async (request, handler) => {
    try {
      return await handler(request);
    } catch (error) {
      // Return a custom error message to the model
      return new ToolMessage({
        content: `Tool error: Please check your input and try again. (${error})`,
        tool_call_id: request.toolCall.id!,
      });
    }
  },
});
export const agent = createAgent({
  model: deepseekModel,
  tools: [getWeather],
  middleware: [dynamicModelSelection, handleToolErrors],
});
