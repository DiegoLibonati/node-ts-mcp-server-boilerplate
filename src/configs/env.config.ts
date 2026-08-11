import * as z from "zod/v4";

import type { Envs } from "@/types/env";

import { loadEnvFiles } from "@/configs/dotenv.config";

import { parseCsv } from "@/helpers/parse_csv.helper";

export const loadedEnvFiles: string[] = loadEnvFiles();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),

  MCP_SERVER_NAME: z.string().min(1).default("mcp-boilerplate"),
  MCP_SERVER_VERSION: z.string().min(1).default("1.0.0"),
  MCP_TRANSPORT: z.enum(["stdio", "http"]).default("stdio"),

  HTTP_HOST: z.string().min(1).default("127.0.0.1"),
  HTTP_PORT: z.coerce.number().int().min(1).max(65535).default(5060),
  HTTP_PATH: z.string().startsWith("/").default("/mcp"),
  ALLOWED_HOSTS: z.string().default("localhost,127.0.0.1").transform(parseCsv),
  ALLOWED_ORIGINS: z.string().default("").transform(parseCsv),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().nonnegative().default(900_000),
  RATE_LIMIT_MAX: z.coerce.number().int().nonnegative().default(0),

  AUTH_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  AUTH_TOKEN: z.string().default(""),

  SEED_DEFAULT_DATA: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");

  throw new Error(`Invalid environment configuration:\n${issues}`);
}

if (parsed.data.AUTH_ENABLED && parsed.data.AUTH_TOKEN.length === 0) {
  throw new Error(
    "Invalid environment configuration:\n  - AUTH_TOKEN: required when AUTH_ENABLED=true"
  );
}

export const envs: Envs = parsed.data;

export const isProduction = (): boolean => envs.NODE_ENV === "production";

export const isTest = (): boolean => envs.NODE_ENV === "test";
