import type { CallToolResult, TextContent } from "@modelcontextprotocol/server";

import { CODES_ERROR, CODES_NOT } from "@/constants/codes.constant";
import { MESSAGES_ERROR } from "@/constants/messages.constant";

import { ConflictError } from "@/errors/conflict.error";
import { NotFoundError } from "@/errors/not_found.error";

import { toErrorResult } from "@/helpers/to_error_result.helper";

const textOf = (result: CallToolResult): string => (result.content[0] as TextContent).text;

describe("to_error_result.helper", () => {
  describe("toErrorResult", () => {
    it("should flag the result as an error the model can read", () => {
      expect(toErrorResult(new NotFoundError("Note 5 not found")).isError).toBe(true);
    });

    it("should prefix the text with the domain code", () => {
      expect(textOf(toErrorResult(new NotFoundError("Note 5 not found")))).toContain(
        CODES_NOT.found
      );
    });

    it("should forward the message of an operational error", () => {
      expect(textOf(toErrorResult(new NotFoundError("Note 5 not found")))).toContain(
        "Note 5 not found"
      );
    });

    it("should carry the code of every domain error", () => {
      expect(textOf(toErrorResult(new ConflictError("Title taken")))).toContain(CODES_NOT.unique);
    });

    it("should collapse an unknown error to the generic code", () => {
      expect(textOf(toErrorResult(new Error("boom")))).toContain(CODES_ERROR.generic);
    });

    it("should never leak the message of an unknown error", () => {
      expect(textOf(toErrorResult(new Error("db password is hunter2")))).not.toContain("hunter2");
    });

    it("should answer with the generic message for an unknown error", () => {
      expect(textOf(toErrorResult(new Error("boom")))).toContain(MESSAGES_ERROR.generic);
    });

    it("should not attach structured content to an error result", () => {
      expect(toErrorResult(new NotFoundError("missing")).structuredContent).toBeUndefined();
    });
  });
});
