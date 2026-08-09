import type * as z from "zod/v4";
import type { healthCheckInputSchema, healthOutputSchema } from "@/schemas/health.schema";
import type {
  createNoteInputSchema,
  deleteNoteInputSchema,
  getNoteInputSchema,
  listNotesInputSchema,
  noteOutputSchema,
  notesListOutputSchema,
  updateNoteInputSchema,
} from "@/schemas/note.schema";
import type { summarizeNotesArgsSchema } from "@/schemas/prompt.schema";

export type ListNotesInput = z.infer<typeof listNotesInputSchema>;
export type GetNoteInput = z.infer<typeof getNoteInputSchema>;
export type CreateNoteInput = z.infer<typeof createNoteInputSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteInputSchema>;
export type DeleteNoteInput = z.infer<typeof deleteNoteInputSchema>;

export type NoteOutput = z.infer<typeof noteOutputSchema>;
export type NotesListOutput = z.infer<typeof notesListOutputSchema>;

export type HealthCheckInput = z.infer<typeof healthCheckInputSchema>;
export type HealthOutput = z.infer<typeof healthOutputSchema>;

export type SummarizeNotesArgs = z.infer<typeof summarizeNotesArgsSchema>;
