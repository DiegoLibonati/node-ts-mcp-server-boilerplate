import { nowIso } from "@/helpers/now_iso.helper";

const FROZEN_NOW = "2026-01-01T12:34:56.789Z";

describe("now_iso.helper", () => {
  describe("nowIso", () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date(FROZEN_NOW));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should return the current instant in iso 8601", () => {
      expect(nowIso()).toBe(FROZEN_NOW);
    });

    it("should always express the instant in utc", () => {
      expect(nowIso().endsWith("Z")).toBe(true);
    });

    it("should follow the clock", () => {
      const before: string = nowIso();

      jest.setSystemTime(new Date("2026-01-02T00:00:00.000Z"));

      expect(nowIso()).not.toBe(before);
    });
  });
});
