import { tool } from "langchain";
import * as z from "zod";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";

const DEFAULT_INDEX_NAME = process.env.PINECONE_INDEX_NAME ?? "document";
const DEFAULT_TOP_K = 4;

let vectorStorePromise: Promise<PineconeStore> | undefined;

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function getVectorStore(): Promise<PineconeStore> {
  if (!vectorStorePromise) {
    vectorStorePromise = (async () => {
      const embeddings = new OpenAIEmbeddings({
        model: "text-embedding-3-large",
      });

      const pinecone = new PineconeClient({
        apiKey: getRequiredEnv("PINECONE_API_KEY"),
      });

      const pineconeIndex = pinecone.Index({
        name: DEFAULT_INDEX_NAME,
      });

      return new PineconeStore(embeddings, {
        pineconeIndex,
        maxConcurrency: 5,
        namespace: process.env.PINECONE_NAMESPACE,
      });
    })();
  }

  return vectorStorePromise;
}

export const retrieveFromPinecone = tool(
  async ({
    query,
    k = DEFAULT_TOP_K,
    filter,
  }: {
    query: string;
    k?: number;
    filter?: Record<string, string | number | boolean>;
  }): Promise<string> => {
    try {
      const vectorStore = await getVectorStore();
      const documents = await vectorStore.similaritySearch(query, k, filter);

      if (documents.length === 0) {
        return "No relevant documents found in Pinecone.";
      }

      return documents
        .map((document, index) => {
          const metadata =
            document.metadata && Object.keys(document.metadata).length > 0
              ? JSON.stringify(document.metadata)
              : "{}";

          return [
            `Result ${index + 1}:`,
            `Source: ${String(document.metadata?.source ?? "unknown")}`,
            `Metadata: ${metadata}`,
            `Content: ${document.pageContent}`,
          ].join("\n");
        })
        .join("\n\n");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return `RAG retrieval failed: ${message}`;
    }
  },
  {
    name: "retrieve_from_pinecone",
    description:
      "Retrieve relevant context from a Pinecone vector store for a user question. Use this before answering knowledge-base questions.",
    schema: z.object({
      query: z
        .string()
        .min(1)
        .describe("The user question or search query used for semantic retrieval"),
      k: z
        .number()
        .int()
        .min(1)
        .max(10)
        .default(DEFAULT_TOP_K)
        .describe("How many relevant documents to retrieve"),
      filter: z
        .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
        .optional()
        .describe("Optional metadata filter for Pinecone similarity search"),
    }),
  },
);
