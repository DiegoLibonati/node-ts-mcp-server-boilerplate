import type { ServerCapabilities } from "@modelcontextprotocol/client";
import type { TestHarness } from "@tests/helpers/create_test_client.helper";

import { createMcpServer } from "@/mcp";

import { SERVER_INFO, SERVER_INSTRUCTIONS } from "@/configs/server.config";

import { createTestClient } from "@tests/helpers/create_test_client.helper";

describe("server (integration)", () => {
  let harness: TestHarness;

  beforeEach(async () => {
    harness = await createTestClient();
  });

  afterEach(async () => {
    await harness.close();
  });

  describe("factory", () => {
    it("should build a new server instance on every call", () => {
      expect(createMcpServer()).not.toBe(createMcpServer());
    });
  });

  describe("identity", () => {
    it("should advertise the configured server name", () => {
      expect(harness.client.getServerVersion()?.name).toBe(SERVER_INFO.name);
    });

    it("should advertise the configured server version", () => {
      expect(harness.client.getServerVersion()?.version).toBe(SERVER_INFO.version);
    });
  });

  describe("capabilities", () => {
    it("should declare the tools capability", () => {
      const capabilities: ServerCapabilities | undefined = harness.client.getServerCapabilities();

      expect(capabilities?.tools).toBeDefined();
    });

    it("should declare the resources capability", () => {
      const capabilities: ServerCapabilities | undefined = harness.client.getServerCapabilities();

      expect(capabilities?.resources).toBeDefined();
    });

    it("should declare the prompts capability", () => {
      const capabilities: ServerCapabilities | undefined = harness.client.getServerCapabilities();

      expect(capabilities?.prompts).toBeDefined();
    });

    it("should declare the completions capability derived from the completable prompt argument", () => {
      const capabilities: ServerCapabilities | undefined = harness.client.getServerCapabilities();

      expect(capabilities?.completions).toBeDefined();
    });

    it("should announce list change notifications for tools", () => {
      const capabilities: ServerCapabilities | undefined = harness.client.getServerCapabilities();

      expect(capabilities?.tools?.listChanged).toBe(true);
    });
  });

  describe("instructions", () => {
    it("should expose the configured instructions to the host", () => {
      expect(harness.client.getInstructions()).toBe(SERVER_INSTRUCTIONS);
    });

    it("should tell the model to list notes before getting one by id", () => {
      expect(harness.client.getInstructions()).toContain("notes_list before notes_get");
    });

    it("should warn that deleting a note is irreversible", () => {
      expect(harness.client.getInstructions()).toContain("notes_delete is irreversible");
    });
  });
});
