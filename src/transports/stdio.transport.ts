import { serveStdio } from "@modelcontextprotocol/server/stdio";

import { createMcpServer } from "@/mcp";

import { logger } from "@/configs/logger.config";

export const startStdioTransport = (): void => {
  logger.info("starting MCP server over stdio");

  serveStdio(() => createMcpServer());
};
