import { createMiddleware } from "langchain";
import { deepseekModel, deepseekV4ProModel } from "../models";

export const dynamicModelSelection = createMiddleware({
  name: "DynamicModelSelection",
  wrapModelCall: (request, handler) => {
    const messageCount = request.messages.length;

    return handler({
      ...request,
      model: messageCount > 10 ? deepseekV4ProModel : deepseekModel,
    });
  },
});
