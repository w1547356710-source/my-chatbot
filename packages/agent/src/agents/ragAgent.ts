import { createAgent } from "langchain";
import { MemorySaver } from "@langchain/langgraph";
import { dynamicModelSelection, handleToolErrors, ragStateMiddleware } from "../middleware";
import { deepseekModel } from "../models";
import { fetchTextFromUrl, fetchTextWithPlaywright, retrieveFromPinecone } from "../tools";

const checkpointer = new MemorySaver();

export const ragAgent = createAgent({
  model: deepseekModel,
  tools: [retrieveFromPinecone, fetchTextFromUrl, fetchTextWithPlaywright],
  systemPrompt: `
You are a RAG Q&A assistant.
Work rules:
1. Before answering knowledge base questions, prioritize calling retrieve_from_pinecone to retrieve relevant context.
2. If the user requests to view the original web page, the web content is dynamically rendered, or there is insufficient information in Pinecone, then use fetch_text_with_playwright.
3. If it is just a normal static page crawl, you can use fetch_text_from_url.
4. When answering, prioritize content returned by tools and do not fabricate facts; if the retrieval results are insufficient, make it clear.
5. Keep answers concise and cite source fields or web URLs where appropriate.
`,
  middleware: [dynamicModelSelection, handleToolErrors, ragStateMiddleware],
  checkpointer,
});
