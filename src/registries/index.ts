import type { McpServer } from "@modelcontextprotocol/server";

import { registerPrompts } from "@/registries/prompt.registry";
import { registerResources } from "@/registries/resource.registry";
import { registerTools } from "@/registries/tool.registry";

export const registerAll = (server: McpServer): void => {
  registerTools(server);
  registerResources(server);
  registerPrompts(server);
};
