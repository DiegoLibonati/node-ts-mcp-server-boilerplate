import { parse } from "dotenv";

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const readEnvFile = (file: string): string | null => {
  try {
    return readFileSync(resolve(process.cwd(), file), "utf-8");
  } catch {
    return null;
  }
};

const resolveMode = (): string => {
  const fromProcess = process.env.NODE_ENV?.trim();

  if (fromProcess) return fromProcess;

  for (const file of [".env.local", ".env"]) {
    const content = readEnvFile(file);

    if (content === null) continue;

    const declared = parse(content).NODE_ENV?.trim();

    if (declared) return declared;
  }

  return "development";
};

export const getEnvFileCandidates = (mode: string): string[] => {
  if (mode === "test") return [".env.test.local", ".env.test"];

  return [`.env.${mode}.local`, ".env.local", `.env.${mode}`, ".env"];
};

export const loadEnvFiles = (): string[] => {
  const appliedFiles: string[] = [];

  for (const file of getEnvFileCandidates(resolveMode())) {
    const content = readEnvFile(file);

    if (content === null) continue;

    for (const [key, value] of Object.entries(parse(content))) {
      process.env[key] ??= value;
    }

    appliedFiles.push(file);
  }

  return appliedFiles;
};
