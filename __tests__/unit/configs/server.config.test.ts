import { envs } from "@/configs/env.config";
import { SERVER_INFO, SERVER_INSTRUCTIONS, SERVER_OPTIONS } from "@/configs/server.config";

describe("server.config", () => {
  describe("SERVER_INFO", () => {
    it("should take the server name from the environment", () => {
      expect(SERVER_INFO.name).toBe(envs.MCP_SERVER_NAME);
    });

    it("should take the server version from the environment", () => {
      expect(SERVER_INFO.version).toBe(envs.MCP_SERVER_VERSION);
    });
  });

  describe("SERVER_INSTRUCTIONS", () => {
    it("should not be empty", () => {
      expect(SERVER_INSTRUCTIONS.length).toBeGreaterThan(0);
    });

    it("should tell the model to list notes before getting one by id", () => {
      expect(SERVER_INSTRUCTIONS).toContain("notes_list before notes_get");
    });

    it("should warn that deleting a note is irreversible", () => {
      expect(SERVER_INSTRUCTIONS).toContain("notes_delete is irreversible");
    });

    it("should state the paging cap the list tool enforces", () => {
      expect(SERVER_INSTRUCTIONS).toContain("100 items per call");
    });
  });

  describe("SERVER_OPTIONS", () => {
    it("should hand the instructions to the sdk", () => {
      expect(SERVER_OPTIONS.instructions).toBe(SERVER_INSTRUCTIONS);
    });

    it("should declare the tools capability", () => {
      expect(SERVER_OPTIONS.capabilities?.tools).toBeDefined();
    });

    it("should declare the resources capability", () => {
      expect(SERVER_OPTIONS.capabilities?.resources).toBeDefined();
    });

    it("should declare the prompts capability", () => {
      expect(SERVER_OPTIONS.capabilities?.prompts).toBeDefined();
    });

    it("should announce list changes for tools", () => {
      expect(SERVER_OPTIONS.capabilities?.tools?.listChanged).toBe(true);
    });

    it("should announce list changes for resources", () => {
      expect(SERVER_OPTIONS.capabilities?.resources?.listChanged).toBe(true);
    });

    it("should announce list changes for prompts", () => {
      expect(SERVER_OPTIONS.capabilities?.prompts?.listChanged).toBe(true);
    });
  });
});
