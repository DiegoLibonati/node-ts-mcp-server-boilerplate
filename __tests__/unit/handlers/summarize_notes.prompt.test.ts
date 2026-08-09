import type { GetPromptResult, TextContent } from "@modelcontextprotocol/server";

import { SummarizeNotesPromptHandler } from "@/handlers/prompts/summarize_notes.prompt";

import { NoteService } from "@/services/note.service";

import {
  mockEmptyNotesListOutput,
  mockNote,
  mockNotesListOutput,
} from "@tests/__mocks__/notes.mock";

jest.mock("@/services/note.service");

const mockNoteService = jest.mocked(NoteService);

const textOf = (result: GetPromptResult): string =>
  (result.messages[0]?.content as TextContent).text;

describe("summarize_notes.prompt", () => {
  describe("get", () => {
    it("should request the full first page of notes", () => {
      mockNoteService.listNotes.mockReturnValue(mockNotesListOutput);

      SummarizeNotesPromptHandler.get({ tone: "concise" });

      expect(mockNoteService.listNotes).toHaveBeenCalledWith({ limit: 100, offset: 0 });
    });

    it("should scope the query to the requested tag", () => {
      mockNoteService.listNotes.mockReturnValue(mockNotesListOutput);

      SummarizeNotesPromptHandler.get({ tag: "docs", tone: "concise" });

      expect(mockNoteService.listNotes).toHaveBeenCalledWith(
        expect.objectContaining({ tag: "docs" })
      );
    });

    it("should build a single user message", () => {
      mockNoteService.listNotes.mockReturnValue(mockNotesListOutput);

      const result: GetPromptResult = SummarizeNotesPromptHandler.get({ tone: "concise" });

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0]?.role).toBe("user");
    });

    it("should send the message as text content", () => {
      mockNoteService.listNotes.mockReturnValue(mockNotesListOutput);

      const result: GetPromptResult = SummarizeNotesPromptHandler.get({ tone: "concise" });

      expect(result.messages[0]?.content.type).toBe("text");
    });

    it("should state the requested tone", () => {
      mockNoteService.listNotes.mockReturnValue(mockNotesListOutput);

      const result: GetPromptResult = SummarizeNotesPromptHandler.get({ tone: "detailed" });

      expect(textOf(result)).toContain("detailed");
    });

    it("should announce that every note is in scope when no tag is given", () => {
      mockNoteService.listNotes.mockReturnValue(mockNotesListOutput);

      const result: GetPromptResult = SummarizeNotesPromptHandler.get({ tone: "concise" });

      expect(textOf(result)).toContain("all notes");
    });

    it("should announce the tag that scopes the summary", () => {
      mockNoteService.listNotes.mockReturnValue(mockNotesListOutput);

      const result: GetPromptResult = SummarizeNotesPromptHandler.get({
        tag: "docs",
        tone: "concise",
      });

      expect(textOf(result)).toContain('notes tagged "docs"');
    });

    it("should embed the title, tags and content of every note", () => {
      mockNoteService.listNotes.mockReturnValue(mockNotesListOutput);

      const result: GetPromptResult = SummarizeNotesPromptHandler.get({ tone: "concise" });

      expect(textOf(result)).toContain(mockNote.title);
      expect(textOf(result)).toContain(mockNote.content);
      expect(textOf(result)).toContain(mockNote.tags.join(", "));
    });

    it("should render a placeholder when there are no notes", () => {
      mockNoteService.listNotes.mockReturnValue(mockEmptyNotesListOutput);

      const result: GetPromptResult = SummarizeNotesPromptHandler.get({ tone: "concise" });

      expect(textOf(result)).toContain("(no notes found)");
    });
  });
});
