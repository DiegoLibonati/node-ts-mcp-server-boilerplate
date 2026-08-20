import type { CallToolResult } from "@modelcontextprotocol/server";
import type { HealthOutput } from "@/types/zod";

import { envs } from "@/configs/env.config";

import { nowIso } from "@/helpers/now_iso.helper";
import { ToolResult } from "@/helpers/to_tool_result.helper";

export const HealthToolHandler = {
  check: (): CallToolResult => {
    const payload: HealthOutput = {
      status: "ok",
      name: envs.MCP_SERVER_NAME,
      version: envs.MCP_SERVER_VERSION,
      transport: envs.MCP_TRANSPORT,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: nowIso(),
    };

    return ToolResult.structured(payload);
  },
};
