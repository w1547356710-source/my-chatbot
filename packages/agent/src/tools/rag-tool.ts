import { tool } from "langchain";
import * as z from "zod";
import { Document } from "@langchain/core/documents";
import { PineconeStore } from "@langchain/pinecone";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { OllamaEmbeddings } from "@langchain/ollama";

const DEFAULT_INDEX_NAME = process.env.PINECONE_INDEX_NAME ?? "document";
const DEFAULT_TOP_K = 4;
const DEFAULT_CHUNK_SIZE = 1200;
const DEFAULT_CHUNK_OVERLAP = 200;

let vectorStorePromise: Promise<PineconeStore> | undefined;

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export async function getVectorStore(): Promise<PineconeStore> {
  if (!vectorStorePromise) {
    vectorStorePromise = (async () => {
      const embeddings = new OllamaEmbeddings({
        model: "bge-m3",
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
      });
    })();
  }

  return vectorStorePromise;
}

function filterNonEmptyDocuments(documents: Document[]): Document[] {
  return documents.filter((document) => document.pageContent.trim().length > 0);
}

function normalizeMetadata(
  metadata: Record<string, string | number | boolean> | undefined,
  source: string,
): Record<string, string | number | boolean> {
  return {
    source,
    ...(metadata ?? {}),
  };
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

export const ingestToPinecone = tool(
  async ({
    content,
    source,
    metadata,
    chunkSize = DEFAULT_CHUNK_SIZE,
    chunkOverlap = DEFAULT_CHUNK_OVERLAP,
  }: {
    content: string;
    source: string;
    metadata?: Record<string, string | number | boolean>;
    chunkSize?: number;
    chunkOverlap?: number;
  }): Promise<string> => {
    try {
      const vectorStore = await getVectorStore();
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize,
        chunkOverlap,
      });

      const baseDocument = new Document({
        pageContent: content,
        metadata: normalizeMetadata(metadata, source),
      });

      const allSplits = await splitter.splitDocuments([baseDocument]);
      const nonEmptySplits = filterNonEmptyDocuments(allSplits);

      if (nonEmptySplits.length === 0) {
        return [
          "RAG ingestion skipped.",
          `Source: ${source}`,
          "Chunks added: 0",
          "Reason: no non-empty chunks were produced from the input content.",
        ].join("\n");
      }

      await vectorStore.addDocuments(nonEmptySplits);

      return [
        "RAG ingestion succeeded.",
        `Source: ${source}`,
        `Chunks added: ${nonEmptySplits.length}`,
        `Chunk size: ${chunkSize}`,
        `Chunk overlap: ${chunkOverlap}`,
      ].join("\n");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return `RAG ingestion failed: ${message}`;
    }
  },
  {
    name: "ingest_to_pinecone",
    description:
      "Split large text into chunks and add the chunks into the Pinecone vector store for later RAG retrieval.",
    schema: z.object({
      content: z
        .string()
        .min(1)
        .describe("The full text content that should be chunked and stored in Pinecone"),
      source: z
        .string()
        .min(1)
        .describe("A stable source identifier such as a file path, URL, or document ID"),
      metadata: z
        .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
        .optional()
        .describe("Optional metadata stored on every chunk"),
      chunkSize: z
        .number()
        .int()
        .min(200)
        .max(4000)
        .default(DEFAULT_CHUNK_SIZE)
        .describe("Maximum characters per chunk"),
      chunkOverlap: z
        .number()
        .int()
        .min(0)
        .max(1000)
        .default(DEFAULT_CHUNK_OVERLAP)
        .describe("Overlapping characters between adjacent chunks"),
    }),
  },
);
