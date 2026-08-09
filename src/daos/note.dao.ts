import type { CreateNoteData, Note, UpdateNoteData } from "@/types/models";

import { nowIso } from "@/helpers/now_iso.helper";

let notes: Note[] = [];
let nextId = 1;

export const NoteDAO = {
  findMany: (): Note[] => [...notes],

  findById: (id: number): Note | undefined => notes.find((note) => note.id === id),

  findByTitle: (title: string): Note | undefined =>
    notes.find((note) => note.title.toLowerCase() === title.toLowerCase()),

  create: (data: CreateNoteData): Note => {
    const timestamp = nowIso();

    const note: Note = {
      id: nextId++,
      title: data.title,
      content: data.content,
      tags: data.tags ?? [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    notes.push(note);

    return note;
  },

  updateById: (id: number, data: UpdateNoteData): Note | undefined => {
    const note = notes.find((candidate) => candidate.id === id);

    if (!note) return undefined;

    if (data.title !== undefined) note.title = data.title;
    if (data.content !== undefined) note.content = data.content;
    if (data.tags !== undefined) note.tags = data.tags;

    note.updatedAt = nowIso();

    return note;
  },

  deleteById: (id: number): boolean => {
    const index = notes.findIndex((note) => note.id === id);

    if (index === -1) return false;

    notes.splice(index, 1);

    return true;
  },

  reset: (): void => {
    notes = [];
    nextId = 1;
  },

  seed: (): void => {
    NoteDAO.reset();

    NoteDAO.create({
      title: "Welcome",
      content: "This note ships with the boilerplate. Delete it once you wire your own domain.",
      tags: ["boilerplate", "example"],
    });

    NoteDAO.create({
      title: "How to extend this server",
      content:
        "Add a schema, a service function, a handler and one entry in the tool registry. " +
        "The wiring never changes.",
      tags: ["boilerplate", "docs"],
    });
  },
};
