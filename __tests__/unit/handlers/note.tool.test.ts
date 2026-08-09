import type { CallToolResult, TextContent } from "@modelcontextprotocol/server";

import { MESSAGES_SUCCESS } from "@/constants/messages.constant";

import { NotFoundError } from "@/errors/not_found.error";

import { NoteToolHandler } from "@/handlers/tools/note.tool";

import { NoteService } from "@/services/note.service";

import {
  mockCreateNoteInput,
  mockEmptyNotesListOutput,
  mockListNotesInput,
  mockNote,
  mockNotesListOutput,
  mockUpdateNoteInput,
} from "@tests/__mocks__/notes.mock";

jest.mock("@/services/note.service");

jest.mock("@/configs/logger.config", () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    fatal: jest.fn(),
  },
}));

const mockNoteService = jest.mocked(NoteService);

const textOf = (result: CallToolResult): string => (result.content[0] as TextContent).text;

describe("note.tool", () => {
  describe("list", () => {
    it("should delegate to the service with the received arguments", () => {
      mockNoteService.listNotes.mockReturnValue(mockNotesListOutput);

      NoteToolHandler.list(mockListNotesInput);

      expect(mockNoteService.listNotes).toHaveBeenCalledWith(mockListNotesInput);
    });

    it("should return the page as structured content", () => {
      mockNoteService.listNotes.mockReturnValue(mockNotesListOutput);

      const result: CallToolResult = NoteToolHandler.list(mockListNotesInput);

      expect(result.structuredContent).toEqual(mockNotesListOutput);
    });

    it("should summarize how many notes were returned out of the total", () => {
      mockNoteService.listNotes.mockReturnValue(mockNotesListOutput);

      const result: CallToolResult = NoteToolHandler.list(mockListNotesInput);

      expect(textOf(result)).toContain("Returning 1 of 1 notes.");
    });

    it("should tell the model when nothing matched the query", () => {
      mockNoteService.listNotes.mockReturnValue(mockEmptyNotesListOutput);

      const result: CallToolResult = NoteToolHandler.list(mockListNotesInput);

      expect(textOf(result)).toContain("No notes matched the query.");
    });
  });

  describe("get", () => {
    it("should delegate to the service with the received arguments", () => {
      mockNoteService.getNote.mockReturnValue(mockNote);

      NoteToolHandler.get({ id: mockNote.id });

      expect(mockNoteService.getNote).toHaveBeenCalledWith({ id: mockNote.id });
    });

    it("should return the note as structured content", () => {
      mockNoteService.getNote.mockReturnValue(mockNote);

      const result: CallToolResult = NoteToolHandler.get({ id: mockNote.id });

      expect(result.structuredContent).toEqual(mockNote);
    });

    it("should let a service failure propagate to the registry wrapper", () => {
      mockNoteService.getNote.mockImplementation(() => {
        throw new NotFoundError("missing");
      });

      expect(() => NoteToolHandler.get({ id: 999 })).toThrow(NotFoundError);
    });
  });

  describe("create", () => {
    it("should delegate to the service with the received arguments", () => {
      mockNoteService.createNote.mockReturnValue(mockNote);

      NoteToolHandler.create(mockCreateNoteInput);

      expect(mockNoteService.createNote).toHaveBeenCalledWith(mockCreateNoteInput);
    });

    it("should return the created note as structured content", () => {
      mockNoteService.createNote.mockReturnValue(mockNote);

      const result: CallToolResult = NoteToolHandler.create(mockCreateNoteInput);

      expect(result.structuredContent).toEqual(mockNote);
    });

    it("should confirm the creation in the text content", () => {
      mockNoteService.createNote.mockReturnValue(mockNote);

      const result: CallToolResult = NoteToolHandler.create(mockCreateNoteInput);

      expect(textOf(result)).toContain(MESSAGES_SUCCESS.createNote);
    });
  });

  describe("update", () => {
    it("should delegate to the service with the received arguments", () => {
      mockNoteService.updateNote.mockReturnValue(mockNote);

      NoteToolHandler.update(mockUpdateNoteInput);

      expect(mockNoteService.updateNote).toHaveBeenCalledWith(mockUpdateNoteInput);
    });

    it("should return the updated note as structured content", () => {
      mockNoteService.updateNote.mockReturnValue(mockNote);

      const result: CallToolResult = NoteToolHandler.update(mockUpdateNoteInput);

      expect(result.structuredContent).toEqual(mockNote);
    });

    it("should confirm the update in the text content", () => {
      mockNoteService.updateNote.mockReturnValue(mockNote);

      const result: CallToolResult = NoteToolHandler.update(mockUpdateNoteInput);

      expect(textOf(result)).toContain(MESSAGES_SUCCESS.updateNote);
    });
  });

  describe("delete", () => {
    it("should delegate to the service with the received arguments", () => {
      mockNoteService.deleteNote.mockReturnValue(mockNote.id);

      NoteToolHandler.delete({ id: mockNote.id });

      expect(mockNoteService.deleteNote).toHaveBeenCalledWith({ id: mockNote.id });
    });

    it("should report the deleted id as structured content", () => {
      mockNoteService.deleteNote.mockReturnValue(mockNote.id);

      const result: CallToolResult = NoteToolHandler.delete({ id: mockNote.id });

      expect(result.structuredContent).toEqual({ id: mockNote.id, deleted: true });
    });

    it("should confirm the deletion in the text content", () => {
      mockNoteService.deleteNote.mockReturnValue(mockNote.id);

      const result: CallToolResult = NoteToolHandler.delete({ id: mockNote.id });

      expect(textOf(result)).toContain(MESSAGES_SUCCESS.deleteNote);
      expect(textOf(result)).toContain(String(mockNote.id));
    });
  });
});
