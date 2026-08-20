import type { CallToolResult } from "@modelcontextprotocol/server";
import type {
  CreateNoteInput,
  DeleteNoteInput,
  GetNoteInput,
  ListNotesInput,
  UpdateNoteInput,
} from "@/types/zod";

import { logger } from "@/configs/logger.config";

import { MESSAGES_SUCCESS } from "@/constants/messages.constant";

import { ToolResult } from "@/helpers/to_tool_result.helper";

import { NoteService } from "@/services/note.service";

export const NoteToolHandler = {
  list: (args: ListNotesInput): CallToolResult => {
    const result = NoteService.listNotes(args);

    const summary =
      result.total === 0
        ? "No notes matched the query."
        : `Returning ${String(result.notes.length)} of ${String(result.total)} notes.`;

    return ToolResult.structured(result, `${summary}\n\n${JSON.stringify(result.notes, null, 2)}`);
  },

  get: (args: GetNoteInput): CallToolResult => ToolResult.structured(NoteService.getNote(args)),

  create: (args: CreateNoteInput): CallToolResult => {
    const note = NoteService.createNote(args);

    logger.info({ noteId: note.id }, "note created");

    return ToolResult.structured(
      note,
      `${MESSAGES_SUCCESS.createNote}\n\n${JSON.stringify(note, null, 2)}`
    );
  },

  update: (args: UpdateNoteInput): CallToolResult => {
    const note = NoteService.updateNote(args);

    return ToolResult.structured(
      note,
      `${MESSAGES_SUCCESS.updateNote}\n\n${JSON.stringify(note, null, 2)}`
    );
  },

  delete: (args: DeleteNoteInput): CallToolResult => {
    const id = NoteService.deleteNote(args);

    return ToolResult.structured(
      { id, deleted: true },
      `${MESSAGES_SUCCESS.deleteNote} Id: ${String(id)}.`
    );
  },
};
