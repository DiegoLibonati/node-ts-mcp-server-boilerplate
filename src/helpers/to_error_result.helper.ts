import type { CallToolResult } from "@modelcontextprotocol/server";

import { getExceptionMessage } from "@/helpers/get_exception_message.helper";

export const toErrorResult = (error: unknown): CallToolResult => {
  const { code, message } = getExceptionMessage(error);

  return {
    content: [{ type: "text", text: `[${code}] ${message}` }],
    isError: true,
  };
};
