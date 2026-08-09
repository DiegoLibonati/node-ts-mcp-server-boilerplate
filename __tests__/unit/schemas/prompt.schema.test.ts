import { summarizeNotesArgsSchema } from "@/schemas/prompt.schema";

describe("prompt.schema", () => {
  describe("summarizeNotesArgsSchema", () => {
    it("should default the tone to concise", () => {
      expect(summarizeNotesArgsSchema.parse({}).tone).toBe("concise");
    });

    it("should leave the tag undefined when it is omitted", () => {
      expect(summarizeNotesArgsSchema.parse({}).tag).toBeUndefined();
    });

    it("should keep the tag it was given", () => {
      expect(summarizeNotesArgsSchema.parse({ tag: "docs" }).tag).toBe("docs");
    });

    it.each<[string]>([["concise"], ["detailed"], ["bullet-points"]])(
      "should accept the %s tone",
      (tone: string) => {
        expect(summarizeNotesArgsSchema.safeParse({ tone }).success).toBe(true);
      }
    );

    it("should still validate the enum wrapped by completable", () => {
      expect(summarizeNotesArgsSchema.safeParse({ tone: "shakespearean" }).success).toBe(false);
    });

    it("should describe the tag argument", () => {
      expect(summarizeNotesArgsSchema.shape.tag.description).toBeTruthy();
    });
  });
});
