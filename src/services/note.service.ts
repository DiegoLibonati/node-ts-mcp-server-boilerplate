import type { Note } from "@/types/models";
import type {
  CreateNoteInput,
  DeleteNoteInput,
  GetNoteInput,
  ListNotesInput,
  NotesListOutput,
  UpdateNoteInput,
} from "@/types/zod";

import { MESSAGES_NOT } from "@/constants/messages.constant";

import { NoteDAO } from "@/daos/note.dao";

import { BadRequestError } from "@/errors/bad_request.error";
import { ConflictError } from "@/errors/conflict.error";
import { NotFoundError } from "@/errors/not_found.error";

export const NoteService = {
  listNotes: (input: ListNotesInput): NotesListOutput => {
    const { search, tag, limit, offset } = input;

    let results: Note[] = NoteDAO.findMany();

    if (search !== undefined) {
      const needle = search.toLowerCase();

      results = results.filter(
        (note) =>
          note.title.toLowerCase().includes(needle) || note.content.toLowerCase().includes(needle)
      );
    }

    if (tag !== undefined) {
      results = results.filter((note) => note.tags.includes(tag));
    }

    const total = results.length;

    return {
      notes: results.slice(offset, offset + limit),
      total,
      limit,
      offset,
    };
  },

  getNote: (input: GetNoteInput): Note => {
    const note = NoteDAO.findById(input.id);

    if (!note) {
      throw new NotFoundError(`${MESSAGES_NOT.foundNote} Received id: ${String(input.id)}.`);
    }

    return note;
  },

  createNote: (input: CreateNoteInput): Note => {
    if (NoteDAO.findByTitle(input.title)) {
      throw new ConflictError(`${MESSAGES_NOT.uniqueTitle} Received title: "${input.title}".`);
    }

    return NoteDAO.create({ title: input.title, content: input.content, tags: input.tags });
  },

  updateNote: (input: UpdateNoteInput): Note => {
    const { id, ...changes } = input;

    const hasChanges = Object.keys(changes).length > 0;

    if (!hasChanges) throw new BadRequestError(MESSAGES_NOT.validUpdate);

    if (changes.title !== undefined) {
      const duplicate = NoteDAO.findByTitle(changes.title);

      if (duplicate && duplicate.id !== id) {
        throw new ConflictError(`${MESSAGES_NOT.uniqueTitle} Received title: "${changes.title}".`);
      }
    }

    const updated = NoteDAO.updateById(id, changes);

    if (!updated) throw new NotFoundError(`${MESSAGES_NOT.foundNote} Received id: ${String(id)}.`);

    return updated;
  },

  deleteNote: (input: DeleteNoteInput): number => {
    const deleted = NoteDAO.deleteById(input.id);

    if (!deleted) {
      throw new NotFoundError(`${MESSAGES_NOT.foundNote} Received id: ${String(input.id)}.`);
    }

    return input.id;
  },
};
