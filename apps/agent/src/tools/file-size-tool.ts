import { stat } from "node:fs/promises";
import { resolve } from "node:path";
import { tool } from "langchain";
import * as z from "zod";

const DEFAULT_LARGE_FILE_BYTES = 100_000;

export const checkFileSize = tool(
  async ({
    filePath,
    largeFileBytes = DEFAULT_LARGE_FILE_BYTES,
  }: {
    filePath: string;
    largeFileBytes?: number;
  }): Promise<string> => {
    try {
      const absolutePath = resolve(filePath);
      const fileStat = await stat(absolutePath);

      if (!fileStat.isFile()) {
        return `File size check failed: Path is not a file. (${absolutePath})`;
      }

      return JSON.stringify({
        path: absolutePath,
        bytes: fileStat.size,
        largeFileBytes,
        isLargeFile: fileStat.size >= largeFileBytes,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return `File size check failed: ${message}`;
    }
  },
  {
    name: "check_file_size",
    description:
      "Check the size of a local file and determine whether it should be treated as a large file for RAG ingestion.",
    schema: z.object({
      filePath: z.string().min(1).describe("The local file path to inspect"),
      largeFileBytes: z
        .number()
        .int()
        .min(1_000)
        .default(DEFAULT_LARGE_FILE_BYTES)
        .describe("The byte threshold used to decide whether the file is large"),
    }),
  },
);
