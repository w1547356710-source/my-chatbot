import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { MultiServerMCPClient, type Connection } from "@langchain/mcp-adapters";
import { tool } from "langchain";
import * as z from "zod";

type CursorServerConfig = Record<string, unknown>;
type CursorMcpConfig = {
  mcpServers?: Record<string, CursorServerConfig>;
};

const WEATHER_TOOL_KEYWORDS = /weather|forecast|temperature|meteo|climate/i;
const SERVER_NAME_ENV = process.env.CURSOR_WEATHER_MCP_SERVER ?? process.env.CURSOR_MCP_SERVER;
const TOOL_NAME_ENV = process.env.CURSOR_WEATHER_MCP_TOOL;

let cachedMcpTools: Promise<DynamicStructuredTool[]> | null = null;

function getCursorConfigPaths() {
  const projectPath = path.join(process.cwd(), ".cursor", "mcp.json");
  const globalPath = path.join(os.homedir(), ".cursor", "mcp.json");
  const explicitPath = process.env.CURSOR_MCP_CONFIG_PATH;

  const paths = [globalPath, projectPath];
  if (explicitPath) {
    paths.push(path.resolve(explicitPath));
  }

  return paths;
}

function workspaceFolderFromConfigPath(configPath: string) {
  const dir = path.dirname(configPath);
  if (path.basename(dir) === ".cursor") {
    return path.dirname(dir);
  }
  return process.cwd();
}

function interpolateString(value: string, configPath: string) {
  const workspaceFolder = workspaceFolderFromConfigPath(configPath);
  return value.replace(/\$\{([^}]+)\}/g, (_, rawKey: string) => {
    const key = rawKey.trim();
    if (key.startsWith("env:")) {
      const envName = key.slice(4);
      return process.env[envName] ?? "";
    }
    switch (key) {
      case "userHome":
        return os.homedir();
      case "workspaceFolder":
        return workspaceFolder;
      case "workspaceFolderBasename":
        return path.basename(workspaceFolder);
      case "pathSeparator":
      case "/":
        return path.sep;
      default:
        return "";
    }
  });
}

function interpolateValue(value: unknown, configPath: string): unknown {
  if (typeof value === "string") {
    return interpolateString(value, configPath);
  }

  if (Array.isArray(value)) {
    return value.map((item) => interpolateValue(item, configPath));
  }

  if (value && typeof value === "object") {
    const input = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(input)) {
      output[key] = interpolateValue(val, configPath);
    }
    return output;
  }

  return value;
}

function readCursorMcpConfigFile(configPath: string): CursorMcpConfig | null {
  if (!fs.existsSync(configPath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(configPath, "utf-8");
    const parsed = JSON.parse(raw) as CursorMcpConfig;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const interpolated = interpolateValue(parsed, configPath) as CursorMcpConfig;
    return interpolated;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[cursor-mcp] Failed to read ${configPath}: ${message}`);
    return null;
  }
}

function normalizeServerConfig(input: CursorServerConfig): Connection | null {
  const type = typeof input.type === "string" ? input.type : undefined;
  const transport = typeof input.transport === "string" ? input.transport : undefined;

  if (typeof input.command === "string") {
    return {
      type: type === "stdio" ? "stdio" : undefined,
      transport: transport === "stdio" ? "stdio" : undefined,
      command: input.command,
      args: Array.isArray(input.args)
        ? input.args.filter((arg): arg is string => typeof arg === "string")
        : [],
      env:
        input.env && typeof input.env === "object"
          ? Object.fromEntries(
              Object.entries(input.env as Record<string, unknown>).filter(
                (entry): entry is [string, string] => typeof entry[1] === "string"
              )
            )
          : undefined,
      cwd: typeof input.cwd === "string" ? input.cwd : undefined,
      restart:
        input.restart && typeof input.restart === "object"
          ? (input.restart as { enabled?: boolean; maxAttempts?: number; delayMs?: number })
          : undefined,
    };
  }

  if (typeof input.url === "string") {
    return {
      type: type === "sse" || type === "http" ? type : undefined,
      transport: transport === "sse" || transport === "http" ? transport : undefined,
      url: input.url,
      headers:
        input.headers && typeof input.headers === "object"
          ? Object.fromEntries(
              Object.entries(input.headers as Record<string, unknown>).filter(
                (entry): entry is [string, string] => typeof entry[1] === "string"
              )
            )
          : undefined,
      reconnect:
        input.reconnect && typeof input.reconnect === "object"
          ? (input.reconnect as { enabled?: boolean; maxAttempts?: number; delayMs?: number })
          : undefined,
      automaticSSEFallback:
        typeof input.automaticSSEFallback === "boolean"
          ? input.automaticSSEFallback
          : undefined,
    };
  }

  return null;
}

function loadMergedMcpServers(): Record<string, Connection> {
  const merged: Record<string, Connection> = {};

  for (const configPath of getCursorConfigPaths()) {
    const config = readCursorMcpConfigFile(configPath);
    if (!config?.mcpServers) {
      continue;
    }

    for (const [serverName, serverConfig] of Object.entries(config.mcpServers)) {
      if (!serverConfig || typeof serverConfig !== "object") {
        continue;
      }

      const normalized = normalizeServerConfig(serverConfig);
      if (normalized) {
        merged[serverName] = normalized;
      }
    }
  }

  if (SERVER_NAME_ENV && merged[SERVER_NAME_ENV]) {
    return { [SERVER_NAME_ENV]: merged[SERVER_NAME_ENV] };
  }

  return merged;
}

async function loadCursorMcpTools(): Promise<DynamicStructuredTool[]> {
  const mcpServers = loadMergedMcpServers();
  if (Object.keys(mcpServers).length === 0) {
    return [];
  }

  const client = new MultiServerMCPClient({
    mcpServers,
    useStandardContentBlocks: true,
    onConnectionError: "ignore",
  });

  return client.getTools();
}

function getToolSchemaKeys(toolDef: DynamicStructuredTool): string[] {
  const schema = toolDef.schema as
    | { shape?: Record<string, unknown>; _def?: { shape?: () => Record<string, unknown> } }
    | undefined;

  if (schema?.shape && typeof schema.shape === "object") {
    return Object.keys(schema.shape);
  }

  if (schema?._def?.shape && typeof schema._def.shape === "function") {
    const dynamicShape = schema._def.shape();
    if (dynamicShape && typeof dynamicShape === "object") {
      return Object.keys(dynamicShape);
    }
  }

  return [];
}

function isLikelyWeatherTool(toolDef: DynamicStructuredTool): boolean {
  const text = `${toolDef.name} ${toolDef.description ?? ""}`;
  if (WEATHER_TOOL_KEYWORDS.test(text)) {
    return true;
  }

  const keys = getToolSchemaKeys(toolDef);
  return keys.some((key) => /city|location|lat|lon|longitude|latitude/i.test(key));
}

function buildWeatherArgs(toolDef: DynamicStructuredTool, city: string): Record<string, string> {
  const keys = getToolSchemaKeys(toolDef);
  const preferred = ["city", "location", "place", "query", "q", "address"];

  for (const key of preferred) {
    if (keys.includes(key)) {
      return { [key]: city };
    }
  }

  if (keys.length === 1) {
    return { [keys[0]]: city };
  }

  return { city };
}

function toTextResult(result: unknown): string {
  if (typeof result === "string") {
    return result;
  }

  try {
    return JSON.stringify(result, null, 2);
  } catch {
    return String(result);
  }
}

async function getCachedCursorMcpTools(): Promise<DynamicStructuredTool[]> {
  if (!cachedMcpTools) {
    cachedMcpTools = loadCursorMcpTools();
  }
  return cachedMcpTools;
}

export const getWeather = tool(
  async ({ city }) => {
    const tools = await getCachedCursorMcpTools();
    if (tools.length === 0) {
      return `No MCP tools available. Add a weather-capable MCP server in .cursor/mcp.json, then retry for city: ${city}`;
    }

    const explicitTool = TOOL_NAME_ENV
      ? tools.find((toolDef) => toolDef.name === TOOL_NAME_ENV)
      : undefined;
    const weatherTool = explicitTool ?? tools.find(isLikelyWeatherTool);

    if (!weatherTool) {
      const available = tools.map((toolDef) => toolDef.name).join(", ");
      return `No weather tool found in MCP servers. Available tools: ${available}`;
    }

    const args = buildWeatherArgs(weatherTool, city);
    const result = await weatherTool.invoke(args);
    return toTextResult(result);
  },
  {
    name: "get_weather",
    description:
      "Get weather for a city by calling tools from Cursor MCP servers configured in .cursor/mcp.json",
    schema: z.object({
      city: z.string().describe("The city to get the weather for"),
    }),
  }
);

export const search = tool(
  ({ query }) => `Results for: ${query}`,
  {
    name: "search",
    description: "Search for information",
    schema: z.object({
      query: z.string().describe("The query to search for"),
    }),
  }
);
