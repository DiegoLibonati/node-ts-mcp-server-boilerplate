import type { ReadResourceResult, TextResourceContents } from "@modelcontextprotocol/server";

import { MIME_TYPES } from "@/constants/resources.constant";

import { NoteDAO } from "@/daos/note.dao";

import { BadRequestError } from "@/errors/bad_request.error";
import { NotFoundError } from "@/errors/not_found.error";

import { NoteResourceHandler } from "@/handlers/resources/note.resource";

import { NoteService } from "@/services/note.service";

import { mockNote, mockSecondNote } from "@tests/__mocks__/notes.mock";

jest.mock("@/daos/note.dao");
jest.mock("@/services/note.service");

const mockNoteDAO = jest.mocked(NoteDAO);
const mockNoteService = jest.mocked(NoteService);

const COLLECTION_URI = new URL("notes://all");
const ITEM_URI = new URL("notes://1");

const textOf = (result: ReadResourceResult): string =>
  (result.contents[0] as TextResourceContents).text;

describe("note.resource", () => {
  describe("readCollection", () => {
    it("should echo back the requested uri", () => {
      mockNoteDAO.findMany.mockReturnValue([]);

      const result: ReadResourceResult = NoteResourceHandler.readCollection(COLLECTION_URI);

      expect(result.contents[0]?.uri).toBe(COLLECTION_URI.href);
    });

    it("should declare the json mime type", () => {
      mockNoteDAO.findMany.mockReturnValue([]);

      const result: ReadResourceResult = NoteResourceHandler.readCollection(COLLECTION_URI);

      expect(result.contents[0]?.mimeType).toBe(MIME_TYPES.json);
    });

    it("should serialize the notes together with their count", () => {
      mockNoteDAO.findMany.mockReturnValue([mockNote, mockSecondNote]);

      const result: ReadResourceResult = NoteResourceHandler.readCollection(COLLECTION_URI);

      expect(JSON.parse(textOf(result))).toEqual({
        notes: [mockNote, mockSecondNote],
        total: 2,
      });
    });

    it("should serialize an empty collection instead of failing", () => {
      mockNoteDAO.findMany.mockReturnValue([]);

      const result: ReadResourceResult = NoteResourceHandler.readCollection(COLLECTION_URI);

      expect(JSON.parse(textOf(result))).toEqual({ notes: [], total: 0 });
    });
  });

  describe("readItem", () => {
    it("should ask the service for the id carried by the uri", () => {
      mockNoteService.getNote.mockReturnValue(mockNote);

      NoteResourceHandler.readItem(ITEM_URI, { id: "1" });

      expect(mockNoteService.getNote).toHaveBeenCalledWith({ id: 1 });
    });

    it("should return the note serialized as json", () => {
      mockNoteService.getNote.mockReturnValue(mockNote);

      const result: ReadResourceResult = NoteResourceHandler.readItem(ITEM_URI, { id: "1" });

      expect(JSON.parse(textOf(result))).toEqual(mockNote);
    });

    it("should echo back the requested uri", () => {
      mockNoteService.getNote.mockReturnValue(mockNote);

      const result: ReadResourceResult = NoteResourceHandler.readItem(ITEM_URI, { id: "1" });

      expect(result.contents[0]?.uri).toBe(ITEM_URI.href);
    });

    it("should take the first value when the template variable arrives as a list", () => {
      mockNoteService.getNote.mockReturnValue(mockNote);

      NoteResourceHandler.readItem(ITEM_URI, { id: ["1", "2"] });

      expect(mockNoteService.getNote).toHaveBeenCalledWith({ id: 1 });
    });

    it("should throw when the id is not a positive integer", () => {
      expect(() => NoteResourceHandler.readItem(new URL("notes://abc"), { id: "abc" })).toThrow(
        BadRequestError
      );
    });

    it("should not reach the service when the id is malformed", () => {
      expect(() => NoteResourceHandler.readItem(new URL("notes://abc"), { id: "abc" })).toThrow(
        BadRequestError
      );
      expect(mockNoteService.getNote).not.toHaveBeenCalled();
    });

    it("should let a missing note surface as a protocol error", () => {
      mockNoteService.getNote.mockImplementation(() => {
        throw new NotFoundError("missing");
      });

      expect(() => NoteResourceHandler.readItem(new URL("notes://999"), { id: "999" })).toThrow(
        NotFoundError
      );
    });
  });

  describe("list", () => {
    it("should enumerate one entry per stored note", () => {
      mockNoteDAO.findMany.mockReturnValue([mockNote, mockSecondNote]);

      expect(NoteResourceHandler.list().resources).toHaveLength(2);
    });

    it("should address every note by its own uri", () => {
      mockNoteDAO.findMany.mockReturnValue([mockNote]);

      expect(NoteResourceHandler.list().resources[0]?.uri).toBe(`notes://${String(mockNote.id)}`);
    });

    it("should name every entry after the note title", () => {
      mockNoteDAO.findMany.mockReturnValue([mockNote]);

      expect(NoteResourceHandler.list().resources[0]?.name).toBe(mockNote.title);
    });

    it("should return an empty enumeration when there are no notes", () => {
      mockNoteDAO.findMany.mockReturnValue([]);

      expect(NoteResourceHandler.list().resources).toEqual([]);
    });
  });
});
