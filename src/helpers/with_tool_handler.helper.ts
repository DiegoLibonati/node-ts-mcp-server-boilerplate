import type { CallToolResult, ServerContext } from "@modelcontextprotocol/server";
import type { ToolHandler } from "@/types/app";
import type { ToolName } from "@/types/constants";

import { logger } from "@/configs/logger.config";

import { getExceptionMessage } from "@/helpers/get_exception_message.helper";
import { toErrorResult } from "@/helpers/to_error_result.helper";

export const withToolHandler = <TArgs>(
  name: ToolName,
  handler: ToolHandler<TArgs>
): ToolHandler<TArgs> => {
  return async (args: TArgs, ctx: ServerContext): Promise<CallToolResult> => {
    const startedAt = Date.now();

    logger.debug({ tool: name }, "tool call started");

    try {
      const result = await handler(args, ctx);

      logger.debug({ tool: name, durationMs: Date.now() - startedAt }, "tool call finished");

      return result;
    } catch (error) {
      const { code, message, isOperational } = getExceptionMessage(error);

      if (isOperational) {
        logger.warn({ tool: name, code, message }, "tool call rejected");
      } else {
        logger.error({ tool: name, code, err: error }, "tool call failed");
      }

      return toErrorResult(error);
    }
  };
};
