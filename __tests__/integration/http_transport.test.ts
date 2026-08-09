import http from "node:http";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";

import type { Server } from "node:http";
import type {
  CallToolResult,
  GetPromptResult,
  ReadResourceResult,
  TextResourceContents,
} from "@modelcontextprotocol/client";
import type { NoteOutput, NotesListOutput } from "@/types/zod";
import type { TestHarness } from "@tests/helpers/create_test_client.helper";

import { envs } from "@/configs/env.config";
import { SERVER_INFO } from "@/configs/server.config";

import { CODES_NOT } from "@/constants/codes.constant";
import { PROMPTS_NOTES } from "@/constants/prompts.constant";
import { RESOURCES_NOTES } from "@/constants/resources.constant";
import { TOOLS_NOTES } from "@/constants/tools.constant";

import { startHttpTransport } from "@/transports/http.transport";

import { createHttpTestClient } from "@tests/helpers/create_test_client.helper";
import { mockCreateNoteInput } from "@tests/__mocks__/notes.mock";

const TEST_PORT = 5099;
const TEST_HOST = "127.0.0.1";

interface ProbeResponse {
  status: number;
  headers: http.IncomingHttpHeaders;
  body: string;
}

const probe = async (path: string, host: string): Promise<ProbeResponse> =>
  new Promise<ProbeResponse>((resolve, reject) => {
    const request = http.request(
      { host: TEST_HOST, port: TEST_PORT, path, method: "GET", headers: { host } },
      (response) => {
        let body = "";

        response.on("data", (chunk: Buffer) => {
          body += chunk.toString();
        });

        response.on("end", () => {
          resolve({ status: response.statusCode ?? 0, headers: response.headers, body });
        });
      }
    );

    request.on("error", reject);
    request.end();
  });

describe("http transport (integration)", () => {
  describe("in-process handler", () => {
    let harness: TestHarness;

    beforeEach(async () => {
      harness = await createHttpTestClient();
    });

    afterEach(async () => {
      await harness.close();
    });

    it("should complete the initialize handshake over streamable http", () => {
      expect(harness.client.getServerVersion()?.name).toBe(SERVER_INFO.name);
    });

    it("should list the registered tools over streamable http", async () => {
      const { tools } = await harness.client.listTools();

      expect(tools.length).toBeGreaterThan(0);
    });

    it("should run a tool call over streamable http", async () => {
      const result: CallToolResult = await harness.client.callTool({
        name: TOOLS_NOTES.create,
        arguments: mockCreateNoteInput,
      });

      expect(result.isError).toBeFalsy();
      expect((result.structuredContent as NoteOutput).title).toBe(mockCreateNoteInput.title);
    });

    it("should map a domain failure to an isError result over streamable http", async () => {
      const result: CallToolResult = await harness.client.callTool({
        name: TOOLS_NOTES.get,
        arguments: { id: 999 },
      });

      expect(result.isError).toBe(true);
      expect(JSON.stringify(result.content)).toContain(CODES_NOT.found);
    });

    it("should share the store across stateless requests", async () => {
      await harness.client.callTool({ name: TOOLS_NOTES.create, arguments: mockCreateNoteInput });

      const result: CallToolResult = await harness.client.callTool({
        name: TOOLS_NOTES.list,
        arguments: {},
      });

      expect((result.structuredContent as NotesListOutput).total).toBe(1);
    });

    it("should read a resource over streamable http", async () => {
      const result: ReadResourceResult = await harness.client.readResource({
        uri: RESOURCES_NOTES.collection.uri,
      });

      expect(result.contents[0]?.uri).toBe(RESOURCES_NOTES.collection.uri);
      expect((result.contents[0] as TextResourceContents).text).toContain("total");
    });

    it("should build a prompt over streamable http", async () => {
      const result: GetPromptResult = await harness.client.getPrompt({
        name: PROMPTS_NOTES.summarize,
        arguments: { tone: "concise" },
      });

      expect(result.messages).toHaveLength(1);
    });
  });

  describe("express server", () => {
    let httpServer: Server;

    beforeAll(async () => {
      jest.replaceProperty(envs, "HTTP_PORT", TEST_PORT);
      jest.replaceProperty(envs, "HTTP_HOST", TEST_HOST);

      httpServer = startHttpTransport();

      await new Promise((resolve) => httpServer.once("listening", resolve));
    });

    afterAll(async () => {
      await new Promise((resolve) => httpServer.close(resolve));
    });

    it("should answer the health probe", async () => {
      const response: ProbeResponse = await probe("/health", TEST_HOST);

      expect(response.status).toBe(200);
      expect(JSON.parse(response.body)).toEqual({ status: "ok" });
    });

    it("should stamp a correlation id on every response", async () => {
      const response: ProbeResponse = await probe("/health", TEST_HOST);

      expect(response.headers["x-request-id"]).toBeTruthy();
    });

    it("should reject a request carrying a foreign host header", async () => {
      const response: ProbeResponse = await probe("/health", "evil.example");

      expect(response.status).not.toBe(200);
    });

    it("should serve the mcp endpoint to a real streamable http client", async () => {
      const transport = new StreamableHTTPClientTransport(
        new URL(`http://${TEST_HOST}:${String(TEST_PORT)}${envs.HTTP_PATH}`)
      );

      const client = new Client({ name: "test-client", version: "1.0.0" });

      await client.connect(transport);
      const { tools } = await client.listTools();
      await client.close();

      expect(tools.length).toBeGreaterThan(0);
    });

    it("should run a tool call through the whole express stack", async () => {
      const transport = new StreamableHTTPClientTransport(
        new URL(`http://${TEST_HOST}:${String(TEST_PORT)}${envs.HTTP_PATH}`)
      );

      const client = new Client({ name: "test-client", version: "1.0.0" });

      await client.connect(transport);
      const result: CallToolResult = await client.callTool({
        name: TOOLS_NOTES.create,
        arguments: mockCreateNoteInput,
      });
      await client.close();

      expect(result.isError).toBeFalsy();
      expect((result.structuredContent as NoteOutput).title).toBe(mockCreateNoteInput.title);
    });
  });
});
