import { serveStdio } from "@modelcontextprotocol/server/stdio";

import { createMcpServer } from "@/mcp";

import { loadedEnvFiles } from "@/configs/env.config";
import { logger } from "@/configs/logger.config";

export const startStdioTransport = (): void => {
  logger.info({ envFiles: loadedEnvFiles }, "starting MCP server over stdio");

  serveStdio(() => createMcpServer());
};
