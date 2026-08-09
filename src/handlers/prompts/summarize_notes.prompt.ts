import type { GetPromptResult } from "@modelcontextprotocol/server";
import type { SummarizeNotesArgs } from "@/types/zod";

import { NoteService } from "@/services/note.service";

export const SummarizeNotesPromptHandler = {
  get: (args: SummarizeNotesArgs): GetPromptResult => {
    const { notes } = NoteService.listNotes({
      limit: 100,
      offset: 0,
      ...(args.tag !== undefined ? { tag: args.tag } : {}),
    });

    const scope = args.tag !== undefined ? `notes tagged "${args.tag}"` : "all notes";

    const body = notes
      .map((note) => `## ${note.title}\n[${note.tags.join(", ")}]\n${note.content}`)
      .join("\n\n");

    return {
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `Summarize ${scope} in a ${args.tone} style.\n\n${body || "(no notes found)"}`,
          },
        },
      ],
    };
  },
};
