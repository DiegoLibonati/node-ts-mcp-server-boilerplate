import * as z from "zod/v4";

export const noteIdSchema = z
  .number()
  .int()
  .positive()
  .describe("Unique identifier of the note. Obtain it from notes_list.");

export const noteOutputSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  content: z.string(),
  tags: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const notesListOutputSchema = z.object({
  notes: z.array(noteOutputSchema),
  total: z.number().int().nonnegative().describe("Total notes matching the query, before paging."),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
});

export const listNotesInputSchema = z.object({
  search: z
    .string()
    .trim()
    .min(1)
    .optional()
    .describe("Case-insensitive substring matched against the title and the content."),
  tag: z.string().trim().min(1).optional().describe("Return only notes carrying this exact tag."),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20)
    .describe("Maximum number of notes to return. Hard capped at 100."),
  offset: z
    .number()
    .int()
    .nonnegative()
    .default(0)
    .describe("Number of notes to skip. Use with limit to page through results."),
});

export const getNoteInputSchema = z.object({
  id: noteIdSchema,
});

export const createNoteInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .describe("Short, unique title for the note. Must not collide with an existing note."),
  content: z.string().trim().min(1).describe("Body of the note. Plain text or markdown."),
  tags: z
    .array(z.string().trim().min(1))
    .max(20)
    .default([])
    .describe("Optional labels used to group and filter notes."),
});

export const updateNoteInputSchema = z.object({
  id: noteIdSchema,
  title: z.string().trim().min(1).max(120).optional().describe("New title. Omit to keep current."),
  content: z.string().trim().min(1).optional().describe("New body. Omit to keep current."),
  tags: z
    .array(z.string().trim().min(1))
    .max(20)
    .optional()
    .describe("Replaces the full tag list. Omit to keep current."),
});

export const deleteNoteInputSchema = z.object({
  id: noteIdSchema,
});
