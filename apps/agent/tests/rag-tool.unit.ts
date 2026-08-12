import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { Document } from "@langchain/core/documents";

const mocks = vi.hoisted(() => {
  const similaritySearch = vi.fn();
  const addDocuments = vi.fn();
  const splitDocuments = vi.fn();
  const pineconeIndex = { name: "mock-index" };
  const indexFactory = vi.fn(() => pineconeIndex);
  const pineconeClient = vi.fn().mockImplementation(function () {
    return {
      Index: indexFactory,
    };
  });
  const embeddings = vi.fn().mockImplementation(function () {
    return { model: "bge-m3" };
  });
  const pineconeStore = vi.fn().mockImplementation(function () {
    return {
      similaritySearch,
      addDocuments,
    };
  });
  const textSplitter = vi.fn().mockImplementation(function () {
    return {
      splitDocuments,
    };
  });

  return {
    addDocuments,
    embeddings,
    indexFactory,
    pineconeClient,
    pineconeIndex,
    pineconeStore,
    similaritySearch,
    splitDocuments,
    textSplitter,
  };
});

vi.mock("@langchain/pinecone", () => ({
  PineconeStore: mocks.pineconeStore,
}));

vi.mock("@pinecone-database/pinecone", () => ({
  Pinecone: mocks.pineconeClient,
}));

vi.mock("@langchain/ollama", () => ({
  OllamaEmbeddings: mocks.embeddings,
}));

vi.mock("@langchain/textsplitters", () => ({
  RecursiveCharacterTextSplitter: mocks.textSplitter,
}));

async function loadModule() {
  vi.resetModules();
  return import("../src/rag");
}

describe("rag-tool 的 Pinecone 集成测试", () => {
  const originalApiKey = process.env.PINECONE_API_KEY;
  const originalIndexName = process.env.PINECONE_INDEX_NAME;

  beforeEach(() => {
    process.env.PINECONE_API_KEY = "test-api-key";
    process.env.PINECONE_INDEX_NAME = "test-index";

    mocks.similaritySearch.mockReset();
    mocks.addDocuments.mockReset();
    mocks.splitDocuments.mockReset();
    mocks.indexFactory.mockClear();
    mocks.pineconeClient.mockClear();
    mocks.embeddings.mockClear();
    mocks.pineconeStore.mockClear();
    mocks.textSplitter.mockClear();
  });

  afterEach(() => {
    if (originalApiKey === undefined) {
      delete process.env.PINECONE_API_KEY;
    } else {
      process.env.PINECONE_API_KEY = originalApiKey;
    }

    if (originalIndexName === undefined) {
      delete process.env.PINECONE_INDEX_NAME;
    } else {
      process.env.PINECONE_INDEX_NAME = originalIndexName;
    }
  });

  it("从 Pinecone 检索文档并格式化响应", async () => {
    mocks.similaritySearch.mockResolvedValue([
      new Document({
        pageContent: "LangGraph can orchestrate tool-calling agents.",
        metadata: { source: "kb/langgraph.md", topic: "langgraph" },
      }),
      new Document({
        pageContent: "Pinecone stores vector embeddings for semantic search.",
        metadata: { source: "kb/pinecone.md" },
      }),
    ]);

    const { retrieveFromPinecone } = await loadModule();
    const result = await retrieveFromPinecone.invoke({
      query: "How does LangGraph use Pinecone?",
      k: 2,
      filter: { topic: "langgraph" },
    });

    expect(mocks.pineconeClient).toHaveBeenCalledWith({ apiKey: "test-api-key" });
    expect(mocks.indexFactory).toHaveBeenCalledWith("test-index");
    expect(mocks.similaritySearch).toHaveBeenCalledWith("How does LangGraph use Pinecone?", 2, {
      topic: "langgraph",
    });
    expect(result).toContain("Result 1:");
    expect(result).toContain("Source: kb/langgraph.md");
    expect(result).toContain("LangGraph can orchestrate tool-calling agents.");
    expect(result).toContain("Result 2:");
  });

  it("在未找到文档时返回稳定的提示信息", async () => {
    mocks.similaritySearch.mockResolvedValue([]);

    const { retrieveFromPinecone } = await loadModule();
    const result = await retrieveFromPinecone.invoke({
      query: "missing content",
    });

    expect(result).toBe("No relevant documents found in Pinecone.");
  });

  it("将分块后的文档写入 Pinecone", async () => {
    mocks.splitDocuments.mockResolvedValue([
      new Document({
        pageContent: "chunk-1",
        metadata: { source: "manual.md", section: "intro" },
      }),
      new Document({
        pageContent: "chunk-2",
        metadata: { source: "manual.md", section: "details" },
      }),
    ]);
    mocks.addDocuments.mockResolvedValue(undefined);

    const { ingestToPinecone } = await loadModule();
    const result = await ingestToPinecone.invoke({
      content: "A long manual that needs chunking.",
      source: "manual.md",
      metadata: { author: "codex" },
      chunkSize: 500,
      chunkOverlap: 50,
    });

    expect(mocks.textSplitter).toHaveBeenCalledWith({
      chunkSize: 500,
      chunkOverlap: 50,
    });
    expect(mocks.splitDocuments).toHaveBeenCalledTimes(1);
    expect(mocks.addDocuments).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          pageContent: "chunk-1",
        }),
        expect.objectContaining({
          pageContent: "chunk-2",
        }),
      ]),
    );
    expect(result).toContain("RAG ingestion succeeded.");
    expect(result).toContain("Source: manual.md");
    expect(result).toContain("Chunks added: 2");
  });

  it("在未生成任何分块时跳过写入 Pinecone", async () => {
    mocks.splitDocuments.mockResolvedValue([]);

    const { ingestToPinecone } = await loadModule();
    const result = await ingestToPinecone.invoke({
      content: "A long manual that needs chunking.",
      source: "manual.md",
    });

    expect(mocks.addDocuments).not.toHaveBeenCalled();
    expect(result).toContain("RAG ingestion skipped.");
    expect(result).toContain("Source: manual.md");
    expect(result).toContain("Chunks added: 0");
  });

  it("在分块结果仅包含空白内容时跳过写入 Pinecone", async () => {
    mocks.splitDocuments.mockResolvedValue([
      new Document({
        pageContent: "   ",
        metadata: { source: "manual.md" },
      }),
      new Document({
        pageContent: "\n\t",
        metadata: { source: "manual.md" },
      }),
    ]);

    const { ingestToPinecone } = await loadModule();
    const result = await ingestToPinecone.invoke({
      content: "A long manual that needs chunking.",
      source: "manual.md",
    });

    expect(mocks.addDocuments).not.toHaveBeenCalled();
    expect(result).toContain("RAG ingestion skipped.");
    expect(result).toContain("Chunks added: 0");
    expect(result).toContain("no non-empty chunks were produced");
  });

  it("在缺少 Pinecone 凭证时返回检索错误", async () => {
    delete process.env.PINECONE_API_KEY;

    const { retrieveFromPinecone } = await loadModule();
    const result = await retrieveFromPinecone.invoke({
      query: "test",
    });

    expect(result).toBe(
      "RAG retrieval failed: Missing required environment variable: PINECONE_API_KEY",
    );
  });

  it("在多次调用之间复用同一个向量存储实例", async () => {
    const { getVectorStore } = await loadModule();

    const first = await getVectorStore();
    const second = await getVectorStore();

    expect(first).toBe(second);
    expect(mocks.embeddings).toHaveBeenCalledTimes(1);
    expect(mocks.pineconeClient).toHaveBeenCalledTimes(1);
    expect(mocks.pineconeStore).toHaveBeenCalledTimes(1);
  });

  it("使用 bge-m3 模型初始化 embeddings 并传入向量存储", async () => {
    const { getVectorStore } = await loadModule();

    await getVectorStore();

    expect(mocks.embeddings).toHaveBeenCalledWith({
      model: "bge-m3",
    });
    expect(mocks.pineconeStore).toHaveBeenCalledWith(
      expect.objectContaining({ model: "bge-m3" }),
      expect.objectContaining({
        pineconeIndex: mocks.pineconeIndex,
        maxConcurrency: 5,
      }),
    );
  });
});
