import { healthCheckInputSchema, healthOutputSchema } from "@/schemas/health.schema";

import { mockHealthOutput } from "@tests/__mocks__/notes.mock";

describe("health.schema", () => {
  describe("healthCheckInputSchema", () => {
    it("should accept an empty argument object", () => {
      expect(healthCheckInputSchema.safeParse({}).success).toBe(true);
    });

    it("should reject a non-object argument", () => {
      expect(healthCheckInputSchema.safeParse("nope").success).toBe(false);
    });
  });

  describe("healthOutputSchema", () => {
    it("should accept the payload the handler produces", () => {
      expect(healthOutputSchema.safeParse(mockHealthOutput).success).toBe(true);
    });

    it("should reject a status other than ok", () => {
      expect(healthOutputSchema.safeParse({ ...mockHealthOutput, status: "down" }).success).toBe(
        false
      );
    });

    it("should reject a negative uptime", () => {
      expect(healthOutputSchema.safeParse({ ...mockHealthOutput, uptimeSeconds: -1 }).success).toBe(
        false
      );
    });

    it("should reject a payload missing the transport", () => {
      const incomplete = {
        status: mockHealthOutput.status,
        name: mockHealthOutput.name,
        version: mockHealthOutput.version,
        uptimeSeconds: mockHealthOutput.uptimeSeconds,
        timestamp: mockHealthOutput.timestamp,
      };

      expect(healthOutputSchema.safeParse(incomplete).success).toBe(false);
    });
  });
});
