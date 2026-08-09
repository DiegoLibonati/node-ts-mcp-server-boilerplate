import type { CallToolResult } from "@modelcontextprotocol/server";
import type { StructuredPayload } from "@/types/app";

export const toToolResult = (data: StructuredPayload, text?: string): CallToolResult => ({
  content: [{ type: "text", text: text ?? JSON.stringify(data, null, 2) }],
  structuredContent: data,
});

export const toTextResult = (text: string): CallToolResult => ({
  content: [{ type: "text", text }],
});
