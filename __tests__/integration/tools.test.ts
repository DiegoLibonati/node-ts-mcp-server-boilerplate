import type { CallToolResult, Tool } from "@modelcontextprotocol/client";
import type { HealthOutput, NoteOutput, NotesListOutput } from "@/types/zod";
import type { TestHarness } from "@tests/helpers/create_test_client.helper";

import { CODES_NOT } from "@/constants/codes.constant";
import { TOOLS_HEALTH, TOOLS_NOTES } from "@/constants/tools.constant";

import { createTestClient } from "@tests/helpers/create_test_client.helper";
import { mockCreateNoteInput, mockSecondNoteInput } from "@tests/__mocks__/notes.mock";

const DECLARED_TOOLS: string[] = [...Object.values(TOOLS_HEALTH), ...Object.values(TOOLS_NOTES)];

const MINIMUM_DESCRIPTION_LENGTH = 30;

describe("tools (integration)", () => {
  let harness: TestHarness;

  const listTools = async (): Promise<Tool[]> => (await harness.client.listTools()).tools;

  const seedNote = async (input = mockCreateNoteInput): Promise<number> => {
    const created: CallToolResult = await harness.client.callTool({
      name: TOOLS_NOTES.create,
      arguments: input,
    });

    return (created.structuredContent as NoteOutput).id;
  };

  beforeEach(async () => {
    harness = await createTestClient();
  });

  afterEach(async () => {
    await harness.close();
  });

  describe("contract", () => {
    it("should advertise every tool declared in the constants map", async () => {
      const names: string[] = (await listTools()).map((tool: Tool) => tool.name);

      expect(names).toEqual(expect.arrayContaining(DECLARED_TOOLS));
    });

    it("should not advertise tools missing from the constants map", async () => {
      const undeclared: string[] = (await listTools())
        .map((tool: Tool) => tool.name)
        .filter((name: string) => !DECLARED_TOOLS.includes(name));

      expect(undeclared).toEqual([]);
    });

    it("should ship a meaningful description on every tool", async () => {
      const poor: string[] = (await listTools())
        .filter((tool: Tool) => (tool.description ?? "").length < MINIMUM_DESCRIPTION_LENGTH)
        .map((tool: Tool) => tool.name);

      expect(poor).toEqual([]);
    });

    it("should ship a human readable title on every tool", async () => {
      const untitled: string[] = (await listTools())
        .filter((tool: Tool) => !tool.title)
        .map((tool: Tool) => tool.name);

      expect(untitled).toEqual([]);
    });

    it("should ship annotations on every tool", async () => {
      const missing: string[] = (await listTools())
        .filter((tool: Tool) => tool.annotations === undefined)
        .map((tool: Tool) => tool.name);

      expect(missing).toEqual([]);
    });

    it("should describe every input schema property", async () => {
      const missing: string[] = (await listTools()).flatMap((tool: Tool) => {
        const properties = (tool.inputSchema.properties ?? {}) as Record<
          string,
          { description?: string }
        >;

        return Object.entries(properties)
          .filter(([, schema]) => !schema.description)
          .map(([name]) => `${tool.name}.${name}`);
      });

      expect(missing).toEqual([]);
    });

    it.each<[string, boolean, boolean | undefined]>([
      [TOOLS_HEALTH.check, true, undefined],
      [TOOLS_NOTES.list, true, undefined],
      [TOOLS_NOTES.get, true, undefined],
      [TOOLS_NOTES.create, false, false],
      [TOOLS_NOTES.update, false, true],
      [TOOLS_NOTES.delete, false, true],
    ])(
      "%s should declare readOnlyHint=%s and destructiveHint=%s",
      async (name: string, readOnly: boolean, destructive: boolean | undefined) => {
        const tool = (await listTools()).find((item: Tool) => item.name === name);

        expect(tool?.annotations?.readOnlyHint).toBe(readOnly);
        expect(tool?.annotations?.destructiveHint).toBe(destructive);
      }
    );

    it.each<[string, boolean]>([
      [TOOLS_HEALTH.check, true],
      [TOOLS_NOTES.list, true],
      [TOOLS_NOTES.get, true],
      [TOOLS_NOTES.create, false],
      [TOOLS_NOTES.update, true],
      [TOOLS_NOTES.delete, false],
    ])("%s should declare idempotentHint=%s", async (name: string, idempotent: boolean) => {
      const tool = (await listTools()).find((item: Tool) => item.name === name);

      expect(tool?.annotations?.idempotentHint).toBe(idempotent);
    });

    it("should declare every tool as closed world", async () => {
      const openWorld: string[] = (await listTools())
        .filter((tool: Tool) => tool.annotations?.openWorldHint !== false)
        .map((tool: Tool) => tool.name);

      expect(openWorld).toEqual([]);
    });

    it.each<[string, boolean]>([
      [TOOLS_HEALTH.check, true],
      [TOOLS_NOTES.list, true],
      [TOOLS_NOTES.get, true],
      [TOOLS_NOTES.create, true],
      [TOOLS_NOTES.update, true],
      [TOOLS_NOTES.delete, false],
    ])("%s should declare an output schema: %s", async (name: string, declared: boolean) => {
      const tool = (await listTools()).find((item: Tool) => item.name === name);

      expect(tool?.outputSchema !== undefined).toBe(declared);
    });

    it("should reject a call to an unknown tool", async () => {
      await expect(
        harness.client.callTool({ name: "does_not_exist", arguments: {} })
      ).rejects.toThrow();
    });
  });

  describe(TOOLS_HEALTH.check, () => {
    it("should report the server as healthy", async () => {
      const result: CallToolResult = await harness.client.callTool({
        name: TOOLS_HEALTH.check,
        arguments: {},
      });

      expect(result.isError).toBeFalsy();
      expect((result.structuredContent as HealthOutput).status).toBe("ok");
    });

    it("should report the server identity and the active transport", async () => {
      const result: CallToolResult = await harness.client.callTool({
        name: TOOLS_HEALTH.check,
        arguments: {},
      });

      const payload = result.structuredContent as HealthOutput;

      expect(payload).toMatchObject({
        name: expect.any(String) as string,
        version: expect.any(String) as string,
        transport: expect.any(String) as string,
        uptimeSeconds: expect.any(Number) as number,
        timestamp: expect.any(String) as string,
      });
    });

    it("should not touch the note collection", async () => {
      await harness.client.callTool({ name: TOOLS_HEALTH.check, arguments: {} });

      const result: CallToolResult = await harness.client.callTool({
        name: TOOLS_NOTES.list,
        arguments: {},
      });

      expect((result.structuredContent as NotesListOutput).total).toBe(0);
    });
  });

  describe(TOOLS_NOTES.list, () => {
    it("should return an empty page when no note exists", async () => {
      const result: CallToolResult = await harness.client.callTool({
        name: TOOLS_NOTES.list,
        arguments: {},
      });

      expect((result.structuredContent as NotesListOutput).total).toBe(0);
    });

    it("should tell the model that nothing matched when the collection is empty", async () => {
      const result: CallToolResult = await harness.client.callTool({
        name: TOOLS_NOTES.list,
        arguments: {},
      });

      expect(JSON.stringify(result.content)).toContain("No notes matched the query.");
    });

    it("should apply the default limit and offset when they are omitted", async () => {
      const result: CallToolResult = await harness.client.callTool({
        name: TOOLS_NOTES.list,
        arguments: {},
      });

      const payload = result.structuredContent as NotesListOutput;

      expect(payload.limit).toBe(20);
      expect(payload.offset).toBe(0);
    });

    it("should make a created note visible to the list tool", async () => {
      await seedNote();

      const result: CallToolResult = await harness.client.callTool({
        name: TOOLS_NOTES.list,
        arguments: {},
      });

      expect((result.structuredContent as NotesListOutput).total).toBe(1);
    });

    it("should match the search term against the title regardless of case", async () => {
      await seedNote();
      await seedNote(mockSecondNoteInput);

      const result: CallToolResult = await harness.client.callTool({
        name: TOOLS_NOTES.list,
        arguments: { search: "SECOND" },
      });

      expect((result.structuredContent as NotesListOutput).total).toBe(1);
    });

    it("should match the search term against the content", async () => {
      await seedNote();
      await seedNote(mockSecondNoteInput);

      const result: CallToolResult = await harness.client.callTool({
        name: TOOLS_NOTES.list,
        arguments: { search: "tagged differently" },
      });

      expect((result.structuredContent as NotesListOutput).notes[0]?.title).toBe(
        mockSecondNoteInput.title
      );
    });

    it("should return only the notes carrying the requested tag", async () => {
      await seedNote();
      await seedNote(mockSecondNoteInput);

      const result: CallToolResult = await harness.client.callTool({
        name: TOOLS_NOTES.list,
        arguments: { tag: "other" },
      });

      expect((result.structuredContent as NotesListOutput).total).toBe(1);
    });

    it("should page through the collection with limit and offset", async () => {
      await seedNote();
      await seedNote(mockSecondNoteInput);

      const result: CallToolResult = await harness.client.callTool({
        name: TOOLS_NOTES.list,
        arguments: { limit: 1, offset: 1 },
      });

      const payload = result.structuredContent as NotesListOutput;

      expect(payload.notes).toHaveLength(1);
      expect(payload.notes[0]?.title).toBe(mockSecondNoteInput.title);
    });

    it("should report the total before paging", async () => {
      await seedNote();
      await seedNote(mockSecondNoteInput);

      const result: CallToolResult = await harness.client.callTool({
        name: TOOLS_NOTES.list,
        arguments: { limit: 1 },
      });

      expect((result.structuredContent as NotesListOutput).total).toBe(2);
    });

    it("should return isError when the limit exceeds the declared maximum", async () => {
      const result: CallToolResult = await harness.client.callTool({
        name: TOOLS_NOTES.list,
        arguments: { limit: 101 },
      });

      expect(result.isError).toBe(true);
      expect(JSON.stringify(result.content)).toContain("validation");
    });
  });

  describe(TOOLS_NOTES.get, () => {
    it("should return the note when it exists", async () => {
      const id: number = await seedNote();

      const result: CallToolResult = await harness.client.callTool({
        name: TOOLS_NOTES.get,
        arguments: { id },
      });

      expect(result.isError).toBeFalsy();
      expect((result.structuredContent as NoteOutput).title).toBe(mockCreateNoteInput.title);
    });

    it("should return both text content and structured content", async () => {
      const id: number = await seedNote();

      const result: CallToolResult = await harness.client.callTool({
        name: TOOLS_NOTES.get,
        arguments: { id },
      });

      expect(result.content[0]).toMatchObject({ type: "text" });
      expect(result.structuredContent).toBeDefined();
    });

    it("should return isError when the note does not exist", async () => {
      const result: CallToolResult = await harness.client.callTool({
        name: TOOLS_NOTES.get,
        arguments: { id: 999 },
      });

      expect(result.isError).toBe(true);
      expect(JSON.stringify(result.content)).toContain(CODES_NOT.found);
    });

    it("should not attach structured content to an error result", async () => {
      const result: CallToolResult = await harness.client.callTool({
        name: TOOLS_NOTES.get,
        arguments: { id: 999 },
      });

      expect(result.structuredContent).toBeUndefined();
    });

    it("should return isError when the id violates the input schema", async () => {
      const result: CallToolResult = await harness.client.callTool({
        name: TOOLS_NOTES.get,
        arguments: { id: -1 },
      });

      expect(result.isError).toBe(true);
      expect(JSON.stringify(result.content)).toContain("validation");
    });
  });

  describe(TOOLS_NOTES.create, () => {
    it("should create a note and return it as structured content", async () => {
      const result: CallToolResult = await harness.client.callTool({
        name: TOOLS_NOTES.create,
        arguments: mockCreateNoteInput,
      });

      const payload = result.structuredContent as NoteOutput;

      expect(result.isError).toBeFalsy();
      expect(payload.title).toBe(mockCreateNoteInput.title);
      expect(payload.id).toEqual(expect.any(Number));
    });

    it("should stamp creation and update timestamps", async () => {
      const result: CallToolResult = await harness.client.callTool({
        name: TOOLS_NOTES.create,
        arguments: mockCreateNoteInput,
      });

      const payload = result.structuredContent as NoteOutput;

      expect(payload.createdAt).toEqual(expect.any(String));
      expect(payload.updatedAt).toBe(payload.createdAt);
    });

    it("should default the tags to an empty list when they are omitted", async () => {
      const result: CallToolResult = await harness.client.callTool({
        name: TOOLS_NOTES.create,
        arguments: { title: "Untagged", content: "No tags here." },
      });

      expect((result.structuredContent as NoteOutput).tags).toEqual([]);
    });

    it("should trim the surrounding whitespace of the title", async () => {
      const result: CallToolResult = await harness.client.callTool({
        name: TOOLS_NOTES.create,
        arguments: { title: "  Padded title  ", content: "Body." },
      });

      expect((result.structuredContent as NoteOutput).title).toBe("Padded title");
    });

    it("should return isError when the title is already taken", async () => {
      await seedNote();

      const result: CallToolResult = await harness.client.callTool({
        name: TOOLS_NOTES.create,
        arguments: mockCreateNoteInput,
      });

      expect(result.isError).toBe(true);
      expect(JSON.stringify(result.content)).toContain(CODES_NOT.unique);
    });

    it("should treat titles differing only in case as taken", async () => {
      await seedNote();

      const result: CallToolResult = await harness.client.callTool({
        name: TOOLS_NOTES.create,
        arguments: { ...mockCreateNoteInput, title: mockCreateNoteInput.title.toUpperCase() },
      });

      expect(result.isError).toBe(true);
      expect(JSON.stringify(result.content)).toContain(CODES_NOT.unique);
    });

    it("should return isError when the title is empty", async () => {
      const result: CallToolResult = await harness.client.callTool({
        name: TOOLS_NOTES.create,
        arguments: { title: "", content: "Body." },
      });

      expect(result.isError).toBe(true);
      expect(JSON.stringify(result.content)).toContain("validation");
    });
  });

  describe(TOOLS_NOTES.update, () => {
    it("should apply the requested title change", async () => {
      const id: number = await seedNote();

      const result: CallToolResult = await harness.client.callTool({
        name: TOOLS_NOTES.update,
        arguments: { id, title: "Renamed" },
      });

      expect((result.structuredContent as NoteOutput).title).toBe("Renamed");
    });

    it("should keep the fields that were not provided", async () => {
      const id: number = await seedNote();

      const result: CallToolResult = await harness.client.callTool({
        name: TOOLS_NOTES.update,
        arguments: { id, title: "Renamed" },
      });

      expect((result.structuredContent as NoteOutput).content).toBe(mockCreateNoteInput.content);
    });

    it("should replace the whole tag list rather than appending to it", async () => {
      const id: number = await seedNote();

      const result: CallToolResult = await harness.client.callTool({
        name: TOOLS_NOTES.update,
        arguments: { id, tags: ["replaced"] },
      });

      expect((result.structuredContent as NoteOutput).tags).toEqual(["replaced"]);
    });

    it("should allow renaming a note to the title it already has", async () => {
      const id: number = await seedNote();

      const result: CallToolResult = await harness.client.callTool({
        name: TOOLS_NOTES.update,
        arguments: { id, title: mockCreateNoteInput.title },
      });

      expect(result.isError).toBeFalsy();
    });

    it("should return isError when the new title belongs to another note", async () => {
      const id: number = await seedNote();
      await seedNote(mockSecondNoteInput);

      const result: CallToolResult = await harness.client.callTool({
        name: TOOLS_NOTES.update,
        arguments: { id, title: mockSecondNoteInput.title },
      });

      expect(result.isError).toBe(true);
      expect(JSON.stringify(result.content)).toContain(CODES_NOT.unique);
    });

    it("should return isError when no field besides the id is provided", async () => {
      const id: number = await seedNote();

      const result: CallToolResult = await harness.client.callTool({
        name: TOOLS_NOTES.update,
        arguments: { id },
      });

      expect(result.isError).toBe(true);
      expect(JSON.stringify(result.content)).toContain(CODES_NOT.valid);
    });

    it("should return isError when the note does not exist", async () => {
      const result: CallToolResult = await harness.client.callTool({
        name: TOOLS_NOTES.update,
        arguments: { id: 999, title: "Renamed" },
      });

      expect(result.isError).toBe(true);
      expect(JSON.stringify(result.content)).toContain(CODES_NOT.found);
    });
  });

  describe(TOOLS_NOTES.delete, () => {
    it("should confirm the deletion in the text content", async () => {
      const id: number = await seedNote();

      const result: CallToolResult = await harness.client.callTool({
        name: TOOLS_NOTES.delete,
        arguments: { id },
      });

      expect(result.isError).toBeFalsy();
      expect(JSON.stringify(result.content)).toContain(String(id));
    });

    it("should remove the note from the collection", async () => {
      const id: number = await seedNote();

      await harness.client.callTool({ name: TOOLS_NOTES.delete, arguments: { id } });

      const result: CallToolResult = await harness.client.callTool({
        name: TOOLS_NOTES.list,
        arguments: {},
      });

      expect((result.structuredContent as NotesListOutput).total).toBe(0);
    });

    it("should return isError when the note does not exist", async () => {
      const result: CallToolResult = await harness.client.callTool({
        name: TOOLS_NOTES.delete,
        arguments: { id: 999 },
      });

      expect(result.isError).toBe(true);
      expect(JSON.stringify(result.content)).toContain(CODES_NOT.found);
    });

    it("should return isError when the same note is deleted twice", async () => {
      const id: number = await seedNote();

      await harness.client.callTool({ name: TOOLS_NOTES.delete, arguments: { id } });

      const result: CallToolResult = await harness.client.callTool({
        name: TOOLS_NOTES.delete,
        arguments: { id },
      });

      expect(result.isError).toBe(true);
    });
  });
});
