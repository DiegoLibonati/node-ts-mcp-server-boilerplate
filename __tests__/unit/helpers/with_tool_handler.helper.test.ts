import type { CallToolResult, ServerContext } from "@modelcontextprotocol/server";

import { logger } from "@/configs/logger.config";

import { CODES_ERROR, CODES_NOT } from "@/constants/codes.constant";
import { TOOLS_NOTES } from "@/constants/tools.constant";

import { NotFoundError } from "@/errors/not_found.error";

import { ToolResult } from "@/helpers/to_tool_result.helper";
import { withToolHandler } from "@/helpers/with_tool_handler.helper";

import { mockNote } from "@tests/__mocks__/notes.mock";

jest.mock("@/configs/logger.config", () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    fatal: jest.fn(),
  },
}));

const mockLogger = jest.mocked(logger);
const mockCtx = {} as ServerContext;

describe("with_tool_handler.helper", () => {
  describe("withToolHandler", () => {
    it("should return the handler result untouched on success", async () => {
      const mockHandler = jest.fn().mockReturnValue(ToolResult.structured(mockNote));

      const result: CallToolResult = await withToolHandler(TOOLS_NOTES.get, mockHandler)(
        { id: 1 },
        mockCtx
      );

      expect(result.structuredContent).toEqual(mockNote);
    });

    it("should forward the arguments and the context to the handler", async () => {
      const mockHandler = jest.fn().mockReturnValue(ToolResult.structured(mockNote));

      await withToolHandler(TOOLS_NOTES.get, mockHandler)({ id: 1 }, mockCtx);

      expect(mockHandler).toHaveBeenCalledWith({ id: 1 }, mockCtx);
    });

    it("should await an asynchronous handler", async () => {
      const mockHandler = jest.fn().mockResolvedValue(ToolResult.structured(mockNote));

      const result: CallToolResult = await withToolHandler(TOOLS_NOTES.get, mockHandler)(
        { id: 1 },
        mockCtx
      );

      expect(result.structuredContent).toEqual(mockNote);
    });

    it("should convert a domain error into an isError result", async () => {
      const mockHandler = jest.fn().mockImplementation(() => {
        throw new NotFoundError("missing");
      });

      const result: CallToolResult = await withToolHandler(TOOLS_NOTES.get, mockHandler)(
        { id: 999 },
        mockCtx
      );

      expect(result.isError).toBe(true);
      expect(JSON.stringify(result.content)).toContain(CODES_NOT.found);
    });

    it("should not let an unexpected error escape to the transport", async () => {
      const mockHandler = jest.fn().mockRejectedValue(new Error("boom"));

      await expect(
        withToolHandler(TOOLS_NOTES.get, mockHandler)({ id: 1 }, mockCtx)
      ).resolves.toBeDefined();
    });

    it("should collapse an unexpected error to the generic code", async () => {
      const mockHandler = jest.fn().mockRejectedValue(new Error("boom"));

      const result: CallToolResult = await withToolHandler(TOOLS_NOTES.get, mockHandler)(
        { id: 1 },
        mockCtx
      );

      expect(JSON.stringify(result.content)).toContain(CODES_ERROR.generic);
    });

    it("should not leak an unexpected error message to the model", async () => {
      const mockHandler = jest.fn().mockRejectedValue(new Error("secret-token-abc"));

      const result: CallToolResult = await withToolHandler(TOOLS_NOTES.get, mockHandler)(
        { id: 1 },
        mockCtx
      );

      expect(JSON.stringify(result.content)).not.toContain("secret-token-abc");
    });

    it("should log an expected failure as a warning", async () => {
      const mockHandler = jest.fn().mockImplementation(() => {
        throw new NotFoundError("missing");
      });

      await withToolHandler(TOOLS_NOTES.get, mockHandler)({ id: 999 }, mockCtx);

      expect(mockLogger.warn).toHaveBeenCalled();
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it("should log an unexpected failure as an error", async () => {
      const mockHandler = jest.fn().mockRejectedValue(new Error("boom"));

      await withToolHandler(TOOLS_NOTES.get, mockHandler)({ id: 1 }, mockCtx);

      expect(mockLogger.error).toHaveBeenCalled();
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    it("should not call the logger error channel on success", async () => {
      const mockHandler = jest.fn().mockReturnValue(ToolResult.structured(mockNote));

      await withToolHandler(TOOLS_NOTES.get, mockHandler)({ id: 1 }, mockCtx);

      expect(mockLogger.error).not.toHaveBeenCalled();
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });
  });
});
