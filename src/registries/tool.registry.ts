import type { McpServer } from "@modelcontextprotocol/server";

import { TOOLS_HEALTH, TOOLS_NOTES } from "@/constants/tools.constant";

import { HealthToolHandler } from "@/handlers/tools/health.tool";

import { NoteToolHandler } from "@/handlers/tools/note.tool";
import { withToolHandler } from "@/helpers/with_tool_handler.helper";

import { healthCheckInputSchema, healthOutputSchema } from "@/schemas/health.schema";
import {
  createNoteInputSchema,
  deleteNoteInputSchema,
  getNoteInputSchema,
  listNotesInputSchema,
  noteOutputSchema,
  notesListOutputSchema,
  updateNoteInputSchema,
} from "@/schemas/note.schema";

export const registerTools = (server: McpServer): void => {
  server.registerTool(
    TOOLS_HEALTH.check,
    {
      title: "Health check",
      description:
        "Report whether the server is running, plus its name, version, active transport and " +
        "uptime. Use it to verify connectivity before diagnosing a failing tool call. " +
        "It never touches note data.",
      inputSchema: healthCheckInputSchema,
      outputSchema: healthOutputSchema,
      annotations: {
        title: "Health check",
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    withToolHandler(TOOLS_HEALTH.check, HealthToolHandler.check)
  );

  server.registerTool(
    TOOLS_NOTES.list,
    {
      title: "List notes",
      description:
        "List stored notes, optionally filtered by a free-text search or an exact tag. " +
        "Call this first whenever a note id is needed but unknown — ids are not guessable. " +
        "Results are paged; read `total` to know whether more pages exist.",
      inputSchema: listNotesInputSchema,
      outputSchema: notesListOutputSchema,
      annotations: {
        title: "List notes",
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    withToolHandler(TOOLS_NOTES.list, NoteToolHandler.list)
  );

  server.registerTool(
    TOOLS_NOTES.get,
    {
      title: "Get note",
      description:
        "Retrieve a single note by its numeric id, including full content and tags. " +
        "Use notes_list first if the id is unknown. Returns an error if no note has that id.",
      inputSchema: getNoteInputSchema,
      outputSchema: noteOutputSchema,
      annotations: {
        title: "Get note",
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    withToolHandler(TOOLS_NOTES.get, NoteToolHandler.get)
  );

  server.registerTool(
    TOOLS_NOTES.create,
    {
      title: "Create note",
      description:
        "Create a new note with a title, a body and optional tags. Titles must be unique: " +
        "the call fails with a NOT_UNIQUE error if one already exists. To change an existing " +
        "note use notes_update instead.",
      inputSchema: createNoteInputSchema,
      outputSchema: noteOutputSchema,
      annotations: {
        title: "Create note",
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    withToolHandler(TOOLS_NOTES.create, NoteToolHandler.create)
  );

  server.registerTool(
    TOOLS_NOTES.update,
    {
      title: "Update note",
      description:
        "Update the title, body or tags of an existing note. Only the fields provided are " +
        "changed; `tags` replaces the whole list rather than appending to it. At least one " +
        "field besides the id is required.",
      inputSchema: updateNoteInputSchema,
      outputSchema: noteOutputSchema,
      annotations: {
        title: "Update note",
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    withToolHandler(TOOLS_NOTES.update, NoteToolHandler.update)
  );

  server.registerTool(
    TOOLS_NOTES.delete,
    {
      title: "Delete note",
      description:
        "Permanently delete a note by id. This cannot be undone — confirm with the user " +
        "before calling it. Returns an error if no note has that id.",
      inputSchema: deleteNoteInputSchema,
      annotations: {
        title: "Delete note",
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    withToolHandler(TOOLS_NOTES.delete, NoteToolHandler.delete)
  );
};
