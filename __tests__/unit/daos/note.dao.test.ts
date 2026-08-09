import type { Note } from "@/types/models";

import { NoteDAO } from "@/daos/note.dao";

import { mockCreateNoteData } from "@tests/__mocks__/notes.mock";

const SECOND_NOTE_DATA = { title: "Second", content: "Another body." };

const FROZEN_NOW = "2026-01-01T00:00:00.000Z";
const LATER = "2026-01-02T00:00:00.000Z";

describe("note.dao", () => {
  describe("findMany", () => {
    it("should start empty after a reset", () => {
      expect(NoteDAO.findMany()).toHaveLength(0);
    });

    it("should return every stored note", () => {
      NoteDAO.create(mockCreateNoteData);
      NoteDAO.create(SECOND_NOTE_DATA);

      expect(NoteDAO.findMany()).toHaveLength(2);
    });

    it("should return a copy so callers cannot mutate the store", () => {
      NoteDAO.create(mockCreateNoteData);

      NoteDAO.findMany().pop();

      expect(NoteDAO.findMany()).toHaveLength(1);
    });
  });

  describe("create", () => {
    it("should assign an auto-incrementing id", () => {
      expect(NoteDAO.create(mockCreateNoteData).id).toBe(1);
      expect(NoteDAO.create(SECOND_NOTE_DATA).id).toBe(2);
    });

    it("should default the tags to an empty list", () => {
      expect(NoteDAO.create(SECOND_NOTE_DATA).tags).toEqual([]);
    });

    it("should keep the tags it was given", () => {
      expect(NoteDAO.create(mockCreateNoteData).tags).toEqual(mockCreateNoteData.tags);
    });

    it("should stamp the same timestamp on creation and update", () => {
      const note: Note = NoteDAO.create(mockCreateNoteData);

      expect(note.createdAt).toBe(note.updatedAt);
    });

    it("should make the note retrievable right away", () => {
      const note: Note = NoteDAO.create(mockCreateNoteData);

      expect(NoteDAO.findById(note.id)).toEqual(note);
    });
  });

  describe("findById", () => {
    it("should return the matching note", () => {
      const note: Note = NoteDAO.create(mockCreateNoteData);

      expect(NoteDAO.findById(note.id)?.title).toBe(mockCreateNoteData.title);
    });

    it("should return undefined when no note has that id", () => {
      expect(NoteDAO.findById(999)).toBeUndefined();
    });
  });

  describe("findByTitle", () => {
    it("should return the matching note", () => {
      NoteDAO.create(mockCreateNoteData);

      expect(NoteDAO.findByTitle(mockCreateNoteData.title)?.id).toBe(1);
    });

    it("should compare titles case-insensitively", () => {
      NoteDAO.create(mockCreateNoteData);

      expect(NoteDAO.findByTitle(mockCreateNoteData.title.toUpperCase())?.id).toBe(1);
    });

    it("should return undefined when no note carries that title", () => {
      expect(NoteDAO.findByTitle("Nothing stored")).toBeUndefined();
    });
  });

  describe("updateById", () => {
    it("should apply only the fields it was given", () => {
      const note: Note = NoteDAO.create(mockCreateNoteData);

      const updated: Note | undefined = NoteDAO.updateById(note.id, { title: "Renamed" });

      expect(updated?.title).toBe("Renamed");
      expect(updated?.content).toBe(mockCreateNoteData.content);
    });

    it("should replace the content", () => {
      const note: Note = NoteDAO.create(mockCreateNoteData);

      expect(NoteDAO.updateById(note.id, { content: "New body." })?.content).toBe("New body.");
    });

    it("should replace the whole tag list", () => {
      const note: Note = NoteDAO.create(mockCreateNoteData);

      expect(NoteDAO.updateById(note.id, { tags: ["replaced"] })?.tags).toEqual(["replaced"]);
    });

    it("should refresh the update timestamp", () => {
      jest.useFakeTimers().setSystemTime(new Date(FROZEN_NOW));
      const note: Note = NoteDAO.create(mockCreateNoteData);

      jest.setSystemTime(new Date(LATER));
      const updated: Note | undefined = NoteDAO.updateById(note.id, { title: "Renamed" });

      expect(updated?.updatedAt).toBe(LATER);
      expect(updated?.createdAt).toBe(FROZEN_NOW);

      jest.useRealTimers();
    });

    it("should persist the change in the store", () => {
      const note: Note = NoteDAO.create(mockCreateNoteData);

      NoteDAO.updateById(note.id, { title: "Renamed" });

      expect(NoteDAO.findById(note.id)?.title).toBe("Renamed");
    });

    it("should return undefined when no note has that id", () => {
      expect(NoteDAO.updateById(999, { title: "Renamed" })).toBeUndefined();
    });
  });

  describe("deleteById", () => {
    it("should report that the note was removed", () => {
      const note: Note = NoteDAO.create(mockCreateNoteData);

      expect(NoteDAO.deleteById(note.id)).toBe(true);
    });

    it("should take the note out of the store", () => {
      const note: Note = NoteDAO.create(mockCreateNoteData);

      NoteDAO.deleteById(note.id);

      expect(NoteDAO.findById(note.id)).toBeUndefined();
    });

    it("should report that nothing was removed the second time", () => {
      const note: Note = NoteDAO.create(mockCreateNoteData);

      NoteDAO.deleteById(note.id);

      expect(NoteDAO.deleteById(note.id)).toBe(false);
    });

    it("should report that nothing was removed for an unknown id", () => {
      expect(NoteDAO.deleteById(999)).toBe(false);
    });
  });

  describe("reset", () => {
    it("should empty the store", () => {
      NoteDAO.create(mockCreateNoteData);

      NoteDAO.reset();

      expect(NoteDAO.findMany()).toEqual([]);
    });

    it("should restart the ids from one", () => {
      NoteDAO.create(mockCreateNoteData);

      NoteDAO.reset();

      expect(NoteDAO.create(mockCreateNoteData).id).toBe(1);
    });
  });

  describe("seed", () => {
    it("should populate the store with the boilerplate notes", () => {
      NoteDAO.seed();

      expect(NoteDAO.findMany()).toHaveLength(2);
    });

    it("should discard whatever was stored before", () => {
      NoteDAO.create(SECOND_NOTE_DATA);

      NoteDAO.seed();

      expect(NoteDAO.findByTitle(SECOND_NOTE_DATA.title)).toBeUndefined();
    });

    it("should tag every seeded note as boilerplate", () => {
      NoteDAO.seed();

      const untagged: string[] = NoteDAO.findMany()
        .filter((note: Note) => !note.tags.includes("boilerplate"))
        .map((note: Note) => note.title);

      expect(untagged).toEqual([]);
    });
  });
});
