import { McpServer } from "@modelcontextprotocol/server";

import { SERVER_INFO, SERVER_OPTIONS } from "@/configs/server.config";

import { registerAll } from "@/registries";

export const createMcpServer = (): McpServer => {
  const server = new McpServer(SERVER_INFO, SERVER_OPTIONS);

  registerAll(server);

  return server;
};
