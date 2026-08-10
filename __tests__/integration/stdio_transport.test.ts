import path from "node:path";
import { execSync, spawn } from "node:child_process";

import type { ChildProcessWithoutNullStreams } from "node:child_process";

interface ProcessOutput {
  stdout: string;
  stderr: string;
}

const ENTRYPOINT: string = path.resolve(process.cwd(), "dist", "main.js");

const BUILD_TIMEOUT_MS = 180_000;
const SPAWN_TIMEOUT_MS = 30_000;
const HANDSHAKE_TIMEOUT_MS = 30_000;
const EXIT_TIMEOUT_MS = 5_000;
const SETTLE_MS = 2_000;
const EXPECTED_RESPONSES = 2;
const STARTUP_LOG = "starting MCP server over stdio";

const INITIALIZE_REQUEST: string = JSON.stringify({
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "purity-probe", version: "1.0.0" },
  },
});

const INITIALIZED_NOTIFICATION: string = JSON.stringify({
  jsonrpc: "2.0",
  method: "notifications/initialized",
});

const LIST_TOOLS_REQUEST: string = JSON.stringify({
  jsonrpc: "2.0",
  id: 2,
  method: "tools/list",
});

const spawnServer = (): ChildProcessWithoutNullStreams =>
  spawn(process.execPath, [ENTRYPOINT], {
    env: { ...process.env, MCP_TRANSPORT: "stdio", NODE_ENV: "test" },
  });

const nonEmptyLinesOf = (raw: string): string[] =>
  raw.split("\n").filter((line: string) => line.trim().length > 0);

const withDeadline = async (work: Promise<unknown>, ms: number): Promise<void> => {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const expired = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, ms);
  });

  try {
    await Promise.race([work, expired]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
};

const terminate = async (child: ChildProcessWithoutNullStreams): Promise<void> => {
  if (child.exitCode !== null || child.signalCode !== null) return;

  const exited = new Promise<void>((resolve) => {
    child.once("exit", () => {
      resolve();
    });
  });

  child.kill();

  await withDeadline(exited, EXIT_TIMEOUT_MS);
};

const runHandshake = async (): Promise<ProcessOutput> => {
  const child: ChildProcessWithoutNullStreams = spawnServer();

  let stdout = "";
  let stderr = "";

  const answered = new Promise<void>((resolve) => {
    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();

      if (nonEmptyLinesOf(stdout).length >= EXPECTED_RESPONSES) resolve();
    });
  });

  const logged = new Promise<void>((resolve) => {
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();

      if (stderr.includes(STARTUP_LOG)) resolve();
    });
  });

  child.stdin.write(`${INITIALIZE_REQUEST}\n`);
  child.stdin.write(`${INITIALIZED_NOTIFICATION}\n`);
  child.stdin.write(`${LIST_TOOLS_REQUEST}\n`);

  await withDeadline(Promise.all([answered, logged]), HANDSHAKE_TIMEOUT_MS);

  await terminate(child);

  return { stdout, stderr };
};

describe("stdio transport (integration)", () => {
  let output: ProcessOutput;
  let lines: string[];

  beforeAll(async () => {
    execSync("npm run build", { stdio: "ignore", timeout: BUILD_TIMEOUT_MS });

    output = await runHandshake();
    lines = nonEmptyLinesOf(output.stdout);
  }, BUILD_TIMEOUT_MS);

  it("should emit only valid json-rpc lines on stdout", () => {
    const contaminated: string[] = lines.filter((line: string) => {
      try {
        return (JSON.parse(line) as { jsonrpc?: string }).jsonrpc !== "2.0";
      } catch {
        return true;
      }
    });

    expect(lines.length).toBeGreaterThan(0);
    expect(contaminated).toEqual([]);
  });

  it("should answer the initialize handshake with its server info", () => {
    const first = JSON.parse(lines[0] ?? "{}") as { result?: { serverInfo?: unknown } };

    expect(first.result?.serverInfo).toBeDefined();
  });

  it("should answer the tools listing over the same stream", () => {
    const responses = lines
      .map((line: string) => JSON.parse(line) as { id?: number; result?: { tools?: unknown[] } })
      .filter((message) => message.id === 2);

    expect(responses[0]?.result?.tools?.length).toBeGreaterThan(0);
  });

  it("should send its startup log to stderr instead of stdout", () => {
    expect(output.stderr).toContain(STARTUP_LOG);
    expect(output.stdout).not.toContain(STARTUP_LOG);
  });

  it(
    "should terminate when the host closes the process",
    async () => {
      const child: ChildProcessWithoutNullStreams = spawnServer();

      await new Promise((resolve) => setTimeout(resolve, SETTLE_MS));

      const exited: boolean = await new Promise((resolve) => {
        child.on("exit", () => {
          resolve(true);
        });

        child.kill("SIGTERM");
      });

      expect(exited).toBe(true);
    },
    SPAWN_TIMEOUT_MS
  );
});
