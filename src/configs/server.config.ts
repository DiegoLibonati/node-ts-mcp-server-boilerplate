import type { Implementation, ServerOptions } from "@modelcontextprotocol/server";

import { envs } from "@/configs/env.config";

export const SERVER_INFO: Implementation = {
  name: envs.MCP_SERVER_NAME,
  version: envs.MCP_SERVER_VERSION,
};

export const SERVER_INSTRUCTIONS = [
  "This server manages a collection of notes.",
  "Call notes_list before notes_get when the note id is unknown — ids are not guessable.",
  "notes_delete is irreversible; confirm with the user before calling it.",
  "List results are capped at 100 items per call; use the offset argument to page.",
].join(" ");

export const SERVER_OPTIONS: ServerOptions = {
  instructions: SERVER_INSTRUCTIONS,
  capabilities: {
    tools: { listChanged: true },
    resources: { listChanged: true },
    prompts: { listChanged: true },
  },
};
