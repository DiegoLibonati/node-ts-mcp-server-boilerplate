import type { CallToolResult, TextContent } from "@modelcontextprotocol/server";

import { toTextResult, toToolResult } from "@/helpers/to_tool_result.helper";

import { mockNote } from "@tests/__mocks__/notes.mock";

describe("to_tool_result.helper", () => {
  describe("toToolResult", () => {
    it("should expose the payload as structured content", () => {
      expect(toToolResult(mockNote).structuredContent).toEqual(mockNote);
    });

    it("should mirror the payload as text content for clients without output schemas", () => {
      const result: CallToolResult = toToolResult(mockNote);

      expect(result.content[0]).toMatchObject({ type: "text" });
      expect(JSON.parse((result.content[0] as TextContent).text)).toEqual(mockNote);
    });

    it("should honour a custom text representation", () => {
      const result: CallToolResult = toToolResult(mockNote, "Done.");

      expect((result.content[0] as TextContent).text).toBe("Done.");
    });

    it("should keep the structured content when the text is customised", () => {
      expect(toToolResult(mockNote, "Done.").structuredContent).toEqual(mockNote);
    });

    it("should not flag a successful result as an error", () => {
      expect(toToolResult(mockNote).isError).toBeUndefined();
    });

    it("should emit exactly one content block", () => {
      expect(toToolResult(mockNote).content).toHaveLength(1);
    });
  });

  describe("toTextResult", () => {
    it("should emit the given text", () => {
      expect((toTextResult("plain").content[0] as TextContent).text).toBe("plain");
    });

    it("should emit no structured content", () => {
      expect(toTextResult("plain").structuredContent).toBeUndefined();
    });

    it("should not flag a successful result as an error", () => {
      expect(toTextResult("plain").isError).toBeUndefined();
    });
  });
});
