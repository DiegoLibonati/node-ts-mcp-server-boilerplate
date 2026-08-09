import { CODES_NOT } from "@/constants/codes.constant";

import { BadRequestError } from "@/errors/bad_request.error";

import { parseNoteId } from "@/helpers/parse_note_id.helper";

describe("parse_note_id.helper", () => {
  describe("parseNoteId", () => {
    it("should parse a numeric string into a number", () => {
      expect(parseNoteId("42")).toBe(42);
    });

    it("should drop the leading zeros of a padded id", () => {
      expect(parseNoteId("007")).toBe(7);
    });

    it("should take the first value when the variable arrives as a list", () => {
      expect(parseNoteId(["3", "4"])).toBe(3);
    });

    it.each<[string | string[] | undefined, string]>([
      ["abc", "letters"],
      ["", "empty string"],
      ["-1", "negative"],
      ["1.5", "decimal"],
      [" 1 ", "padded with spaces"],
      [undefined, "missing"],
      [[], "empty list"],
    ])("should reject %p (%s)", (raw: string | string[] | undefined) => {
      expect(() => parseNoteId(raw)).toThrow(BadRequestError);
    });

    it("should report the rejected value in the error message", () => {
      expect(() => parseNoteId("abc")).toThrow(/abc/);
    });

    it("should carry the invalid input domain code", () => {
      expect(() => parseNoteId("abc")).toThrow(
        expect.objectContaining({ code: CODES_NOT.valid }) as Error
      );
    });
  });
});
