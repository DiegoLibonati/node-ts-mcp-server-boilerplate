import type { ReadResourceResult, Variables } from "@modelcontextprotocol/server";

import { MIME_TYPES } from "@/constants/resources.constant";

import { NoteDAO } from "@/daos/note.dao";

import { parseNoteId } from "@/helpers/parse_note_id.helper";

import { NoteService } from "@/services/note.service";

export const NoteResourceHandler = {
  readCollection: (uri: URL): ReadResourceResult => {
    const notes = NoteDAO.findMany();

    return {
      contents: [
        {
          uri: uri.href,
          mimeType: MIME_TYPES.json,
          text: JSON.stringify({ notes, total: notes.length }, null, 2),
        },
      ],
    };
  },

  readItem: (uri: URL, variables: Variables): ReadResourceResult => {
    const id = parseNoteId(variables.id);
    const note = NoteService.getNote({ id });

    return {
      contents: [
        {
          uri: uri.href,
          mimeType: MIME_TYPES.json,
          text: JSON.stringify(note, null, 2),
        },
      ],
    };
  },

  list: (): { resources: { uri: string; name: string }[] } => ({
    resources: NoteDAO.findMany().map((note) => ({
      uri: `notes://${String(note.id)}`,
      name: note.title,
    })),
  }),
};
