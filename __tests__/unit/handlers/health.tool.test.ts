import type { CallToolResult, TextContent } from "@modelcontextprotocol/server";
import type { HealthOutput } from "@/types/zod";

import { envs } from "@/configs/env.config";

import { HealthToolHandler } from "@/handlers/tools/health.tool";

import { healthOutputSchema } from "@/schemas/health.schema";

const FROZEN_NOW = "2026-01-01T00:00:00.000Z";

describe("health.tool", () => {
  describe("check", () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date(FROZEN_NOW));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should report the server as healthy", () => {
      const result: CallToolResult = HealthToolHandler.check();

      expect((result.structuredContent as HealthOutput).status).toBe("ok");
    });

    it("should report the configured server identity", () => {
      const payload = HealthToolHandler.check().structuredContent as HealthOutput;

      expect(payload.name).toBe(envs.MCP_SERVER_NAME);
      expect(payload.version).toBe(envs.MCP_SERVER_VERSION);
    });

    it("should report the active transport", () => {
      const payload = HealthToolHandler.check().structuredContent as HealthOutput;

      expect(payload.transport).toBe(envs.MCP_TRANSPORT);
    });

    it("should report the process uptime as a whole number of seconds", () => {
      const payload = HealthToolHandler.check().structuredContent as HealthOutput;

      expect(Number.isInteger(payload.uptimeSeconds)).toBe(true);
      expect(payload.uptimeSeconds).toBeGreaterThanOrEqual(0);
    });

    it("should stamp the result with the current time", () => {
      const payload = HealthToolHandler.check().structuredContent as HealthOutput;

      expect(payload.timestamp).toBe(FROZEN_NOW);
    });

    it("should return a payload that satisfies the declared output schema", () => {
      const payload = HealthToolHandler.check().structuredContent;

      expect(healthOutputSchema.safeParse(payload).success).toBe(true);
    });

    it("should mirror the payload in the text content", () => {
      const result: CallToolResult = HealthToolHandler.check();

      expect(JSON.parse((result.content[0] as TextContent).text)).toEqual(result.structuredContent);
    });

    it("should not flag a healthy result as an error", () => {
      expect(HealthToolHandler.check().isError).toBeUndefined();
    });
  });
});
