import type { CallToolResult, ServerContext } from "@modelcontextprotocol/server";

export type ToolHandler<TArgs> = (
  args: TArgs,
  ctx: ServerContext
) => Promise<CallToolResult> | CallToolResult;

export type StructuredPayload = Record<string, unknown>;
