import type { CallToolResult, TextContent } from "@modelcontextprotocol/server";

import { ToolResult } from "@/helpers/to_tool_result.helper";

import { mockNote } from "@tests/__mocks__/notes.mock";

describe("to_tool_result.helper", () => {
  describe("ToolResult.structured", () => {
    it("should expose the payload as structured content", () => {
      expect(ToolResult.structured(mockNote).structuredContent).toEqual(mockNote);
    });

    it("should mirror the payload as text content for clients without output schemas", () => {
      const result: CallToolResult = ToolResult.structured(mockNote);

      expect(result.content[0]).toMatchObject({ type: "text" });
      expect(JSON.parse((result.content[0] as TextContent).text)).toEqual(mockNote);
    });

    it("should honour a custom text representation", () => {
      const result: CallToolResult = ToolResult.structured(mockNote, "Done.");

      expect((result.content[0] as TextContent).text).toBe("Done.");
    });

    it("should keep the structured content when the text is customised", () => {
      expect(ToolResult.structured(mockNote, "Done.").structuredContent).toEqual(mockNote);
    });

    it("should not flag a successful result as an error", () => {
      expect(ToolResult.structured(mockNote).isError).toBeUndefined();
    });

    it("should emit exactly one content block", () => {
      expect(ToolResult.structured(mockNote).content).toHaveLength(1);
    });
  });

  describe("ToolResult.text", () => {
    it("should emit the given text", () => {
      expect((ToolResult.text("plain").content[0] as TextContent).text).toBe("plain");
    });

    it("should emit no structured content", () => {
      expect(ToolResult.text("plain").structuredContent).toBeUndefined();
    });

    it("should not flag a successful result as an error", () => {
      expect(ToolResult.text("plain").isError).toBeUndefined();
    });
  });
});
