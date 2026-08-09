import { parseCsv } from "@/helpers/parse_csv.helper";

describe("parse_csv.helper", () => {
  describe("parseCsv", () => {
    it("should split the value on commas", () => {
      expect(parseCsv("localhost,127.0.0.1")).toEqual(["localhost", "127.0.0.1"]);
    });

    it("should trim the surrounding whitespace of every item", () => {
      expect(parseCsv(" localhost , 127.0.0.1 ")).toEqual(["localhost", "127.0.0.1"]);
    });

    it("should drop the empty items left by trailing separators", () => {
      expect(parseCsv("localhost,,127.0.0.1,")).toEqual(["localhost", "127.0.0.1"]);
    });

    it("should return an empty list for an empty value", () => {
      expect(parseCsv("")).toEqual([]);
    });

    it("should return an empty list for a blank value", () => {
      expect(parseCsv("   ")).toEqual([]);
    });

    it("should wrap a single value in a list", () => {
      expect(parseCsv("localhost")).toEqual(["localhost"]);
    });
  });
});
