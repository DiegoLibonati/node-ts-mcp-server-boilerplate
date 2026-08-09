import { completable } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

const TONES = ["concise", "detailed", "bullet-points"] as const;

export const summarizeNotesArgsSchema = z.object({
  tag: z
    .string()
    .optional()
    .describe("Restrict the summary to notes carrying this tag. Omit to summarize everything."),
  tone: completable(
    z.enum(TONES).default("concise").describe("How the summary should be written."),
    (value) => TONES.filter((tone) => tone.startsWith(value ?? ""))
  ),
});
