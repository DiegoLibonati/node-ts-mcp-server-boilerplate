import type { CompleteResult, GetPromptResult, Prompt } from "@modelcontextprotocol/client";
import type { TestHarness } from "@tests/helpers/create_test_client.helper";

import { PROMPTS_NOTES } from "@/constants/prompts.constant";
import { TOOLS_NOTES } from "@/constants/tools.constant";

import { createTestClient } from "@tests/helpers/create_test_client.helper";
import { mockCreateNoteInput, mockSecondNoteInput } from "@tests/__mocks__/notes.mock";

describe("prompts (integration)", () => {
  let harness: TestHarness;

  const seedNote = async (input = mockCreateNoteInput): Promise<void> => {
    await harness.client.callTool({ name: TOOLS_NOTES.create, arguments: input });
  };

  beforeEach(async () => {
    harness = await createTestClient();
  });

  afterEach(async () => {
    await harness.close();
  });

  describe("contract", () => {
    it("should advertise the summarize prompt", async () => {
      const { prompts } = await harness.client.listPrompts();

      expect(prompts.map((prompt: Prompt) => prompt.name)).toContain(PROMPTS_NOTES.summarize);
    });

    it("should ship a description on every prompt", async () => {
      const { prompts } = await harness.client.listPrompts();

      const undescribed: string[] = prompts
        .filter((prompt: Prompt) => !prompt.description)
        .map((prompt: Prompt) => prompt.name);

      expect(undescribed).toEqual([]);
    });

    it("should declare the tag and tone arguments", async () => {
      const { prompts } = await harness.client.listPrompts();

      const prompt = prompts.find((item: Prompt) => item.name === PROMPTS_NOTES.summarize);
      const names: string[] = (prompt?.arguments ?? []).map((argument) => argument.name);

      expect(names).toEqual(expect.arrayContaining(["tag", "tone"]));
    });

    it("should describe every declared argument", async () => {
      const { prompts } = await harness.client.listPrompts();

      const missing: string[] = prompts.flatMap((prompt: Prompt) =>
        (prompt.arguments ?? [])
          .filter((argument) => !argument.description)
          .map((argument) => `${prompt.name}.${argument.name}`)
      );

      expect(missing).toEqual([]);
    });

    it("should mark every argument as optional", async () => {
      const { prompts } = await harness.client.listPrompts();

      const prompt = prompts.find((item: Prompt) => item.name === PROMPTS_NOTES.summarize);

      const required: string[] = (prompt?.arguments ?? [])
        .filter((argument) => argument.required === true)
        .map((argument) => argument.name);

      expect(required).toEqual([]);
    });

    it("should reject an unknown prompt", async () => {
      await expect(
        harness.client.getPrompt({ name: "does_not_exist", arguments: {} })
      ).rejects.toThrow();
    });
  });

  describe(PROMPTS_NOTES.summarize, () => {
    it("should build a single user message", async () => {
      await seedNote();

      const result: GetPromptResult = await harness.client.getPrompt({
        name: PROMPTS_NOTES.summarize,
        arguments: { tone: "concise" },
      });

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0]?.role).toBe("user");
    });

    it("should embed the stored note bodies in the message", async () => {
      await seedNote();

      const result: GetPromptResult = await harness.client.getPrompt({
        name: PROMPTS_NOTES.summarize,
        arguments: { tone: "concise" },
      });

      expect(JSON.stringify(result.messages)).toContain(mockCreateNoteInput.content);
    });

    it("should state the requested tone", async () => {
      await seedNote();

      const result: GetPromptResult = await harness.client.getPrompt({
        name: PROMPTS_NOTES.summarize,
        arguments: { tone: "bullet-points" },
      });

      expect(JSON.stringify(result.messages)).toContain("bullet-points");
    });

    it("should fall back to the default tone when it is omitted", async () => {
      await seedNote();

      const result: GetPromptResult = await harness.client.getPrompt({
        name: PROMPTS_NOTES.summarize,
        arguments: {},
      });

      expect(JSON.stringify(result.messages)).toContain("concise");
    });

    it("should scope the prompt to the requested tag", async () => {
      await seedNote();
      await seedNote(mockSecondNoteInput);

      const result: GetPromptResult = await harness.client.getPrompt({
        name: PROMPTS_NOTES.summarize,
        arguments: { tag: "other", tone: "concise" },
      });

      expect(JSON.stringify(result.messages)).not.toContain(mockCreateNoteInput.content);
    });

    it("should render a placeholder when no note matches", async () => {
      await seedNote();

      const result: GetPromptResult = await harness.client.getPrompt({
        name: PROMPTS_NOTES.summarize,
        arguments: { tag: "does-not-exist", tone: "concise" },
      });

      expect(JSON.stringify(result.messages)).toContain("(no notes found)");
    });

    it("should render a placeholder when the collection is empty", async () => {
      const result: GetPromptResult = await harness.client.getPrompt({
        name: PROMPTS_NOTES.summarize,
        arguments: { tone: "concise" },
      });

      expect(JSON.stringify(result.messages)).toContain("(no notes found)");
    });

    it("should reject a tone outside the declared enum", async () => {
      await expect(
        harness.client.getPrompt({
          name: PROMPTS_NOTES.summarize,
          arguments: { tone: "shakespearean" },
        })
      ).rejects.toThrow();
    });
  });

  describe("completions", () => {
    it("should suggest the tone matching the typed prefix", async () => {
      const result: CompleteResult = await harness.client.complete({
        ref: { type: "ref/prompt", name: PROMPTS_NOTES.summarize },
        argument: { name: "tone", value: "con" },
      });

      expect(result.completion.values).toContain("concise");
    });

    it("should suggest every tone for an empty prefix", async () => {
      const result: CompleteResult = await harness.client.complete({
        ref: { type: "ref/prompt", name: PROMPTS_NOTES.summarize },
        argument: { name: "tone", value: "" },
      });

      expect(result.completion.values).toEqual(
        expect.arrayContaining(["concise", "detailed", "bullet-points"])
      );
    });

    it("should return no suggestion for a non-matching prefix", async () => {
      const result: CompleteResult = await harness.client.complete({
        ref: { type: "ref/prompt", name: PROMPTS_NOTES.summarize },
        argument: { name: "tone", value: "zzz" },
      });

      expect(result.completion.values).toHaveLength(0);
    });
  });
});
