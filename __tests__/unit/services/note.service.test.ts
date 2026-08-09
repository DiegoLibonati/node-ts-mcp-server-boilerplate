import type { Note } from "@/types/models";
import type { NotesListOutput } from "@/types/zod";

import { NoteDAO } from "@/daos/note.dao";

import { BadRequestError } from "@/errors/bad_request.error";
import { ConflictError } from "@/errors/conflict.error";
import { NotFoundError } from "@/errors/not_found.error";

import { NoteService } from "@/services/note.service";

import {
  mockCreateNoteData,
  mockCreateNoteInput,
  mockListNotesInput,
  mockNote,
  mockSecondNote,
} from "@tests/__mocks__/notes.mock";

jest.mock("@/daos/note.dao");

const mockNoteDAO = jest.mocked(NoteDAO);
const STORED_NOTES: Note[] = [mockNote, mockSecondNote];

describe("note.service", () => {
  describe("listNotes", () => {
    it("should return every stored note when no filter is given", () => {
      mockNoteDAO.findMany.mockReturnValue(STORED_NOTES);

      const result: NotesListOutput = NoteService.listNotes(mockListNotesInput);

      expect(result.notes).toEqual(STORED_NOTES);
    });

    it("should echo back the requested limit and offset", () => {
      mockNoteDAO.findMany.mockReturnValue(STORED_NOTES);

      const result: NotesListOutput = NoteService.listNotes({ limit: 5, offset: 1 });

      expect(result.limit).toBe(5);
      expect(result.offset).toBe(1);
    });

    it("should match the search term against the title", () => {
      mockNoteDAO.findMany.mockReturnValue(STORED_NOTES);

      const result: NotesListOutput = NoteService.listNotes({
        ...mockListNotesInput,
        search: "Second",
      });

      expect(result.notes).toEqual([mockSecondNote]);
    });

    it("should match the search term against the content", () => {
      mockNoteDAO.findMany.mockReturnValue(STORED_NOTES);

      const result: NotesListOutput = NoteService.listNotes({
        ...mockListNotesInput,
        search: "tagged differently",
      });

      expect(result.notes).toEqual([mockSecondNote]);
    });

    it("should match the search term regardless of case", () => {
      mockNoteDAO.findMany.mockReturnValue(STORED_NOTES);

      const result: NotesListOutput = NoteService.listNotes({
        ...mockListNotesInput,
        search: "SECOND",
      });

      expect(result.notes).toEqual([mockSecondNote]);
    });

    it("should return only the notes carrying the requested tag", () => {
      mockNoteDAO.findMany.mockReturnValue(STORED_NOTES);

      const result: NotesListOutput = NoteService.listNotes({
        ...mockListNotesInput,
        tag: "other",
      });

      expect(result.notes).toEqual([mockSecondNote]);
    });

    it("should require an exact tag match", () => {
      mockNoteDAO.findMany.mockReturnValue(STORED_NOTES);

      const result: NotesListOutput = NoteService.listNotes({ ...mockListNotesInput, tag: "oth" });

      expect(result.notes).toEqual([]);
    });

    it("should combine the search and the tag filters", () => {
      mockNoteDAO.findMany.mockReturnValue(STORED_NOTES);

      const result: NotesListOutput = NoteService.listNotes({
        ...mockListNotesInput,
        search: "Second",
        tag: "mock",
      });

      expect(result.notes).toEqual([]);
    });

    it("should page the results with the limit and the offset", () => {
      mockNoteDAO.findMany.mockReturnValue(STORED_NOTES);

      const result: NotesListOutput = NoteService.listNotes({ limit: 1, offset: 1 });

      expect(result.notes).toEqual([mockSecondNote]);
    });

    it("should count the matches before paging", () => {
      mockNoteDAO.findMany.mockReturnValue(STORED_NOTES);

      const result: NotesListOutput = NoteService.listNotes({ limit: 1, offset: 0 });

      expect(result.total).toBe(2);
    });

    it("should count only the notes that survived the filters", () => {
      mockNoteDAO.findMany.mockReturnValue(STORED_NOTES);

      const result: NotesListOutput = NoteService.listNotes({
        ...mockListNotesInput,
        tag: "other",
      });

      expect(result.total).toBe(1);
    });

    it("should return an empty page when the store is empty", () => {
      mockNoteDAO.findMany.mockReturnValue([]);

      const result: NotesListOutput = NoteService.listNotes(mockListNotesInput);

      expect(result).toEqual({ notes: [], total: 0, limit: 20, offset: 0 });
    });
  });

  describe("getNote", () => {
    it("should return the note when it exists", () => {
      mockNoteDAO.findById.mockReturnValue(mockNote);

      expect(NoteService.getNote({ id: mockNote.id })).toEqual(mockNote);
    });

    it("should ask the dao for the requested id", () => {
      mockNoteDAO.findById.mockReturnValue(mockNote);

      NoteService.getNote({ id: mockNote.id });

      expect(mockNoteDAO.findById).toHaveBeenCalledWith(mockNote.id);
    });

    it("should throw NotFoundError when the note does not exist", () => {
      mockNoteDAO.findById.mockReturnValue(undefined);

      expect(() => NoteService.getNote({ id: 999 })).toThrow(NotFoundError);
    });

    it("should include the received id in the error message", () => {
      mockNoteDAO.findById.mockReturnValue(undefined);

      expect(() => NoteService.getNote({ id: 999 })).toThrow(/999/);
    });
  });

  describe("createNote", () => {
    it("should store the note when the title is free", () => {
      mockNoteDAO.findByTitle.mockReturnValue(undefined);
      mockNoteDAO.create.mockReturnValue(mockNote);

      expect(NoteService.createNote(mockCreateNoteInput)).toEqual(mockNote);
    });

    it("should hand the dao only the persisted fields", () => {
      mockNoteDAO.findByTitle.mockReturnValue(undefined);
      mockNoteDAO.create.mockReturnValue(mockNote);

      NoteService.createNote(mockCreateNoteInput);

      expect(mockNoteDAO.create).toHaveBeenCalledWith(mockCreateNoteData);
    });

    it("should throw ConflictError when the title is taken", () => {
      mockNoteDAO.findByTitle.mockReturnValue(mockNote);

      expect(() => NoteService.createNote(mockCreateNoteInput)).toThrow(ConflictError);
    });

    it("should not store anything when the title is taken", () => {
      mockNoteDAO.findByTitle.mockReturnValue(mockNote);

      expect(() => NoteService.createNote(mockCreateNoteInput)).toThrow(ConflictError);
      expect(mockNoteDAO.create).not.toHaveBeenCalled();
    });

    it("should include the rejected title in the error message", () => {
      mockNoteDAO.findByTitle.mockReturnValue(mockNote);

      expect(() => NoteService.createNote(mockCreateNoteInput)).toThrow(
        new RegExp(mockCreateNoteInput.title)
      );
    });
  });

  describe("updateNote", () => {
    it("should return the updated note", () => {
      mockNoteDAO.updateById.mockReturnValue(mockNote);

      expect(NoteService.updateNote({ id: 1, content: "New body." })).toEqual(mockNote);
    });

    it("should hand the dao only the requested changes", () => {
      mockNoteDAO.updateById.mockReturnValue(mockNote);

      NoteService.updateNote({ id: 1, content: "New body." });

      expect(mockNoteDAO.updateById).toHaveBeenCalledWith(1, { content: "New body." });
    });

    it("should throw BadRequestError when no field besides the id is given", () => {
      expect(() => NoteService.updateNote({ id: 1 })).toThrow(BadRequestError);
    });

    it("should not touch the dao when there is nothing to change", () => {
      expect(() => NoteService.updateNote({ id: 1 })).toThrow(BadRequestError);
      expect(mockNoteDAO.updateById).not.toHaveBeenCalled();
    });

    it("should allow renaming a note to the title it already has", () => {
      mockNoteDAO.findByTitle.mockReturnValue(mockNote);
      mockNoteDAO.updateById.mockReturnValue(mockNote);

      expect(() =>
        NoteService.updateNote({ id: mockNote.id, title: mockNote.title })
      ).not.toThrow();
    });

    it("should throw ConflictError when the title belongs to another note", () => {
      mockNoteDAO.findByTitle.mockReturnValue(mockSecondNote);

      expect(() =>
        NoteService.updateNote({ id: mockNote.id, title: mockSecondNote.title })
      ).toThrow(ConflictError);
    });

    it("should not check the title when it is not being changed", () => {
      mockNoteDAO.updateById.mockReturnValue(mockNote);

      NoteService.updateNote({ id: 1, content: "New body." });

      expect(mockNoteDAO.findByTitle).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError when the note does not exist", () => {
      mockNoteDAO.updateById.mockReturnValue(undefined);

      expect(() => NoteService.updateNote({ id: 999, content: "New body." })).toThrow(
        NotFoundError
      );
    });

    it("should include the received id in the not found message", () => {
      mockNoteDAO.updateById.mockReturnValue(undefined);

      expect(() => NoteService.updateNote({ id: 999, content: "New body." })).toThrow(/999/);
    });
  });

  describe("deleteNote", () => {
    it("should return the id of the deleted note", () => {
      mockNoteDAO.deleteById.mockReturnValue(true);

      expect(NoteService.deleteNote({ id: mockNote.id })).toBe(mockNote.id);
    });

    it("should ask the dao to delete the requested id", () => {
      mockNoteDAO.deleteById.mockReturnValue(true);

      NoteService.deleteNote({ id: mockNote.id });

      expect(mockNoteDAO.deleteById).toHaveBeenCalledWith(mockNote.id);
    });

    it("should throw NotFoundError when nothing was deleted", () => {
      mockNoteDAO.deleteById.mockReturnValue(false);

      expect(() => NoteService.deleteNote({ id: 999 })).toThrow(NotFoundError);
    });

    it("should include the received id in the error message", () => {
      mockNoteDAO.deleteById.mockReturnValue(false);

      expect(() => NoteService.deleteNote({ id: 999 })).toThrow(/999/);
    });
  });
});
