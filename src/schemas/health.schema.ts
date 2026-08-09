import * as z from "zod/v4";

export const healthCheckInputSchema = z.object({});

export const healthOutputSchema = z.object({
  status: z.literal("ok"),
  name: z.string(),
  version: z.string(),
  transport: z.string(),
  uptimeSeconds: z.number().nonnegative(),
  timestamp: z.string(),
});
