import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { getEnvFileCandidates, loadEnvFiles } from "@/configs/dotenv.config";

describe("dotenv.config", () => {
  const originalEnv: NodeJS.ProcessEnv = process.env;

  let tempDir: string;
  let cwdSpy: jest.SpyInstance<string, []>;

  const writeEnvFile = (file: string, content: string): void => {
    writeFileSync(join(tempDir, file), content);
  };

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "dotenv-config-"));
    cwdSpy = jest.spyOn(process, "cwd").mockReturnValue(tempDir);
    process.env = { ...originalEnv };
    delete process.env.NODE_ENV;
    delete process.env.MCP_SERVER_NAME;
  });

  afterEach(() => {
    cwdSpy.mockRestore();
    process.env = originalEnv;
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe("getEnvFileCandidates", () => {
    it("should order the candidates from most to least specific", () => {
      expect(getEnvFileCandidates("development")).toEqual([
        ".env.development.local",
        ".env.local",
        ".env.development",
        ".env",
      ]);
    });

    it("should build the candidate names from the mode", () => {
      expect(getEnvFileCandidates("production")).toEqual([
        ".env.production.local",
        ".env.local",
        ".env.production",
        ".env",
      ]);
    });

    it("should only return the test files in test mode", () => {
      expect(getEnvFileCandidates("test")).toEqual([".env.test.local", ".env.test"]);
    });
  });

  describe("loadEnvFiles", () => {
    it("should return an empty list when no env file exists", () => {
      expect(loadEnvFiles()).toEqual([]);
    });

    it("should load variables from .env", () => {
      writeEnvFile(".env", "MCP_SERVER_NAME=from-dotenv");

      const appliedFiles: string[] = loadEnvFiles();

      expect(appliedFiles).toEqual([".env"]);
      expect(process.env.MCP_SERVER_NAME).toBe("from-dotenv");
    });

    it("should not override variables already present in process.env", () => {
      process.env.MCP_SERVER_NAME = "from-process";
      writeEnvFile(".env", "MCP_SERVER_NAME=from-dotenv");

      loadEnvFiles();

      expect(process.env.MCP_SERVER_NAME).toBe("from-process");
    });

    it("should prefer .env.local over the mode file and .env", () => {
      writeEnvFile(".env.local", "MCP_SERVER_NAME=from-local");
      writeEnvFile(".env.development", "MCP_SERVER_NAME=from-mode");
      writeEnvFile(".env", "MCP_SERVER_NAME=from-dotenv");

      loadEnvFiles();

      expect(process.env.MCP_SERVER_NAME).toBe("from-local");
    });

    it("should prefer the mode local file over every other file", () => {
      writeEnvFile(".env.development.local", "MCP_SERVER_NAME=from-mode-local");
      writeEnvFile(".env.local", "MCP_SERVER_NAME=from-local");
      writeEnvFile(".env.development", "MCP_SERVER_NAME=from-mode");
      writeEnvFile(".env", "MCP_SERVER_NAME=from-dotenv");

      loadEnvFiles();

      expect(process.env.MCP_SERVER_NAME).toBe("from-mode-local");
    });

    it("should prefer the mode file over .env", () => {
      writeEnvFile(".env.development", "MCP_SERVER_NAME=from-mode");
      writeEnvFile(".env", "MCP_SERVER_NAME=from-dotenv");

      loadEnvFiles();

      expect(process.env.MCP_SERVER_NAME).toBe("from-mode");
    });

    it("should report every applied file in precedence order", () => {
      writeEnvFile(".env.local", "LOCAL_ONLY_KEY=1");
      writeEnvFile(".env", "DOTENV_ONLY_KEY=2");

      expect(loadEnvFiles()).toEqual([".env.local", ".env"]);
    });
  });

  describe("mode resolution", () => {
    it("should use the NODE_ENV of the process", () => {
      process.env.NODE_ENV = "production";
      writeEnvFile(".env.production", "MCP_SERVER_NAME=from-production");
      writeEnvFile(".env.development", "MCP_SERVER_NAME=from-development");

      loadEnvFiles();

      expect(process.env.MCP_SERVER_NAME).toBe("from-production");
    });

    it("should read NODE_ENV from .env.local when the process does not set it", () => {
      writeEnvFile(".env.local", "NODE_ENV=production");
      writeEnvFile(".env.production", "MCP_SERVER_NAME=from-production");

      loadEnvFiles();

      expect(process.env.MCP_SERVER_NAME).toBe("from-production");
    });

    it("should fall back to the NODE_ENV declared in .env", () => {
      writeEnvFile(".env", "NODE_ENV=production");
      writeEnvFile(".env.production", "MCP_SERVER_NAME=from-production");

      loadEnvFiles();

      expect(process.env.MCP_SERVER_NAME).toBe("from-production");
    });

    it("should prefer the NODE_ENV of .env.local over the one of .env", () => {
      writeEnvFile(".env.local", "NODE_ENV=production");
      writeEnvFile(".env", "NODE_ENV=development");
      writeEnvFile(".env.production", "MCP_SERVER_NAME=from-production");
      writeEnvFile(".env.development", "MCP_SERVER_NAME=from-development");

      loadEnvFiles();

      expect(process.env.MCP_SERVER_NAME).toBe("from-production");
    });

    it("should default to development when NODE_ENV is not declared anywhere", () => {
      writeEnvFile(".env.development", "MCP_SERVER_NAME=from-development");
      writeEnvFile(".env.production", "MCP_SERVER_NAME=from-production");

      loadEnvFiles();

      expect(process.env.MCP_SERVER_NAME).toBe("from-development");
    });
  });

  describe("test mode", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "test";
    });

    it("should ignore .env and .env.local", () => {
      writeEnvFile(".env", "MCP_SERVER_NAME=from-dotenv");
      writeEnvFile(".env.local", "MCP_SERVER_NAME=from-local");

      const appliedFiles: string[] = loadEnvFiles();

      expect(appliedFiles).toEqual([]);
      expect(process.env.MCP_SERVER_NAME).toBeUndefined();
    });

    it("should load .env.test", () => {
      writeEnvFile(".env.test", "MCP_SERVER_NAME=from-test");

      const appliedFiles: string[] = loadEnvFiles();

      expect(appliedFiles).toEqual([".env.test"]);
      expect(process.env.MCP_SERVER_NAME).toBe("from-test");
    });

    it("should prefer .env.test.local over .env.test", () => {
      writeEnvFile(".env.test.local", "MCP_SERVER_NAME=from-test-local");
      writeEnvFile(".env.test", "MCP_SERVER_NAME=from-test");

      loadEnvFiles();

      expect(process.env.MCP_SERVER_NAME).toBe("from-test-local");
    });
  });
});
