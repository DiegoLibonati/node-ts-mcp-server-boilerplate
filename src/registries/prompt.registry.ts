import type { McpServer } from "@modelcontextprotocol/server";

import { PROMPTS_NOTES } from "@/constants/prompts.constant";

import { SummarizeNotesPromptHandler } from "@/handlers/prompts/summarize_notes.prompt";

import { summarizeNotesArgsSchema } from "@/schemas/prompt.schema";

export const registerPrompts = (server: McpServer): void => {
  server.registerPrompt(
    PROMPTS_NOTES.summarize,
    {
      title: "Summarize notes",
      description: "Build a summary of the stored notes, optionally scoped to a single tag.",
      argsSchema: summarizeNotesArgsSchema,
    },
    (args) => SummarizeNotesPromptHandler.get(args)
  );
};
