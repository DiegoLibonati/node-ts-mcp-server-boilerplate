import type * as z from "zod/v4";

import {
  createNoteInputSchema,
  deleteNoteInputSchema,
  getNoteInputSchema,
  listNotesInputSchema,
  noteOutputSchema,
  notesListOutputSchema,
  updateNoteInputSchema,
} from "@/schemas/note.schema";

import { mockNote, mockNotesListOutput } from "@tests/__mocks__/notes.mock";

const undescribedFieldsOf = (shape: Record<string, z.ZodType>): string[] =>
  Object.entries(shape)
    .filter(([, field]) => !field.description)
    .map(([name]) => name);

describe("note.schema", () => {
  describe("listNotesInputSchema", () => {
    it("should apply the default limit and offset", () => {
      const result = listNotesInputSchema.parse({});

      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
    });

    it("should accept the maximum allowed limit", () => {
      expect(listNotesInputSchema.safeParse({ limit: 100 }).success).toBe(true);
    });

    it("should reject a limit above the maximum", () => {
      expect(listNotesInputSchema.safeParse({ limit: 101 }).success).toBe(false);
    });

    it("should reject a limit below one", () => {
      expect(listNotesInputSchema.safeParse({ limit: 0 }).success).toBe(false);
    });

    it("should reject a negative offset", () => {
      expect(listNotesInputSchema.safeParse({ offset: -1 }).success).toBe(false);
    });

    it("should trim the search term", () => {
      expect(listNotesInputSchema.parse({ search: "  notes  " }).search).toBe("notes");
    });

    it("should reject a search term that is blank once trimmed", () => {
      expect(listNotesInputSchema.safeParse({ search: "   " }).success).toBe(false);
    });

    it("should trim the tag", () => {
      expect(listNotesInputSchema.parse({ tag: "  docs  " }).tag).toBe("docs");
    });

    it("should describe every field", () => {
      expect(undescribedFieldsOf(listNotesInputSchema.shape)).toEqual([]);
    });
  });

  describe("getNoteInputSchema", () => {
    it("should accept a positive integer id", () => {
      expect(getNoteInputSchema.parse({ id: 7 }).id).toBe(7);
    });

    it.each<[unknown, string]>([
      [{ id: 0 }, "zero"],
      [{ id: -1 }, "negative"],
      [{ id: 1.5 }, "non-integer"],
      [{ id: "1" }, "string"],
      [{}, "missing"],
    ])("should reject %o (%s)", (input: unknown) => {
      expect(getNoteInputSchema.safeParse(input).success).toBe(false);
    });

    it("should describe every field", () => {
      expect(undescribedFieldsOf(getNoteInputSchema.shape)).toEqual([]);
    });
  });

  describe("createNoteInputSchema", () => {
    it("should default the tags to an empty list", () => {
      expect(createNoteInputSchema.parse({ title: "T", content: "C" }).tags).toEqual([]);
    });

    it("should trim the title", () => {
      expect(createNoteInputSchema.parse({ title: "  T  ", content: "C" }).title).toBe("T");
    });

    it("should trim the content", () => {
      expect(createNoteInputSchema.parse({ title: "T", content: "  C  " }).content).toBe("C");
    });

    it("should reject a title that is blank once trimmed", () => {
      expect(createNoteInputSchema.safeParse({ title: "   ", content: "C" }).success).toBe(false);
    });

    it("should accept a title of exactly the maximum length", () => {
      expect(
        createNoteInputSchema.safeParse({ title: "T".repeat(120), content: "C" }).success
      ).toBe(true);
    });

    it("should reject a title above the maximum length", () => {
      expect(
        createNoteInputSchema.safeParse({ title: "T".repeat(121), content: "C" }).success
      ).toBe(false);
    });

    it("should reject an empty content", () => {
      expect(createNoteInputSchema.safeParse({ title: "T", content: "" }).success).toBe(false);
    });

    it("should reject a blank tag", () => {
      expect(
        createNoteInputSchema.safeParse({ title: "T", content: "C", tags: ["  "] }).success
      ).toBe(false);
    });

    it("should reject more tags than the declared maximum", () => {
      const tags: string[] = Array.from({ length: 21 }, (_value, index) => `tag-${String(index)}`);

      expect(createNoteInputSchema.safeParse({ title: "T", content: "C", tags }).success).toBe(
        false
      );
    });

    it("should describe every field", () => {
      expect(undescribedFieldsOf(createNoteInputSchema.shape)).toEqual([]);
    });
  });

  describe("updateNoteInputSchema", () => {
    it("should accept an update carrying only the id", () => {
      expect(updateNoteInputSchema.safeParse({ id: 1 }).success).toBe(true);
    });

    it("should leave the omitted fields undefined", () => {
      const result = updateNoteInputSchema.parse({ id: 1, title: "Renamed" });

      expect(result.content).toBeUndefined();
      expect(result.tags).toBeUndefined();
    });

    it("should trim the new title", () => {
      expect(updateNoteInputSchema.parse({ id: 1, title: "  Renamed  " }).title).toBe("Renamed");
    });

    it("should reject a blank new title", () => {
      expect(updateNoteInputSchema.safeParse({ id: 1, title: "   " }).success).toBe(false);
    });

    it("should reject an update without an id", () => {
      expect(updateNoteInputSchema.safeParse({ title: "Renamed" }).success).toBe(false);
    });

    it("should describe every field", () => {
      expect(undescribedFieldsOf(updateNoteInputSchema.shape)).toEqual([]);
    });
  });

  describe("deleteNoteInputSchema", () => {
    it("should accept a positive integer id", () => {
      expect(deleteNoteInputSchema.parse({ id: 3 }).id).toBe(3);
    });

    it("should reject a missing id", () => {
      expect(deleteNoteInputSchema.safeParse({}).success).toBe(false);
    });

    it("should describe every field", () => {
      expect(undescribedFieldsOf(deleteNoteInputSchema.shape)).toEqual([]);
    });
  });

  describe("noteOutputSchema", () => {
    it("should accept a stored note", () => {
      expect(noteOutputSchema.safeParse(mockNote).success).toBe(true);
    });

    it("should reject a note missing its timestamps", () => {
      const incomplete = {
        id: mockNote.id,
        title: mockNote.title,
        content: mockNote.content,
        tags: mockNote.tags,
      };

      expect(noteOutputSchema.safeParse(incomplete).success).toBe(false);
    });

    it("should reject a note without tags", () => {
      const incomplete = {
        id: mockNote.id,
        title: mockNote.title,
        content: mockNote.content,
        createdAt: mockNote.createdAt,
        updatedAt: mockNote.updatedAt,
      };

      expect(noteOutputSchema.safeParse(incomplete).success).toBe(false);
    });
  });

  describe("notesListOutputSchema", () => {
    it("should accept a page produced by the service", () => {
      expect(notesListOutputSchema.safeParse(mockNotesListOutput).success).toBe(true);
    });

    it("should accept an empty page", () => {
      expect(
        notesListOutputSchema.safeParse({ notes: [], total: 0, limit: 20, offset: 0 }).success
      ).toBe(true);
    });

    it("should reject a negative total", () => {
      expect(
        notesListOutputSchema.safeParse({ notes: [], total: -1, limit: 20, offset: 0 }).success
      ).toBe(false);
    });
  });
});
