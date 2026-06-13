import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";

const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-large",
});

const pinecone = new PineconeClient({
  apiKey: process.env.PINECONE_API_KEY!,
});
const pineconeIndex = pinecone.Index({
  name: "document",
});

const vectorStore = new PineconeStore(embeddings, {
  pineconeIndex,
  maxConcurrency: 5,
});
