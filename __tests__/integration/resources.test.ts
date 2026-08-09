import type {
  CallToolResult,
  ReadResourceResult,
  Resource,
  ResourceTemplateType,
  TextResourceContents,
} from "@modelcontextprotocol/client";
import type { NoteOutput } from "@/types/zod";
import type { TestHarness } from "@tests/helpers/create_test_client.helper";

import { MIME_TYPES, RESOURCES_NOTES } from "@/constants/resources.constant";
import { TOOLS_NOTES } from "@/constants/tools.constant";

import { createTestClient } from "@tests/helpers/create_test_client.helper";
import { mockCreateNoteInput, mockSecondNoteInput } from "@tests/__mocks__/notes.mock";

interface CollectionPayload {
  notes: NoteOutput[];
  total: number;
}

describe("resources (integration)", () => {
  let harness: TestHarness;

  const seedNote = async (input = mockCreateNoteInput): Promise<number> => {
    const created: CallToolResult = await harness.client.callTool({
      name: TOOLS_NOTES.create,
      arguments: input,
    });

    return (created.structuredContent as NoteOutput).id;
  };

  const readText = (result: ReadResourceResult): string =>
    (result.contents[0] as TextResourceContents).text;

  beforeEach(async () => {
    harness = await createTestClient();
  });

  afterEach(async () => {
    await harness.close();
  });

  describe("contract", () => {
    it("should advertise the static collection resource", async () => {
      const { resources } = await harness.client.listResources();

      expect(
        resources.some((resource: Resource) => resource.uri === RESOURCES_NOTES.collection.uri)
      ).toBe(true);
    });

    it("should advertise the note template", async () => {
      const { resourceTemplates } = await harness.client.listResourceTemplates();

      expect(
        resourceTemplates.some(
          (template: ResourceTemplateType) => template.uriTemplate === RESOURCES_NOTES.item.template
        )
      ).toBe(true);
    });

    it("should declare a mime type on every advertised resource", async () => {
      await seedNote();

      const { resources } = await harness.client.listResources();

      const untyped: string[] = resources
        .filter((resource: Resource) => !resource.mimeType)
        .map((resource: Resource) => resource.uri);

      expect(untyped).toEqual([]);
    });

    it("should declare a description on the note template", async () => {
      const { resourceTemplates } = await harness.client.listResourceTemplates();

      const template = resourceTemplates.find(
        (item: ResourceTemplateType) => item.uriTemplate === RESOURCES_NOTES.item.template
      );

      expect(template?.description).toBeTruthy();
    });
  });

  describe(RESOURCES_NOTES.collection.name, () => {
    it("should echo back the requested uri", async () => {
      const result: ReadResourceResult = await harness.client.readResource({
        uri: RESOURCES_NOTES.collection.uri,
      });

      expect(result.contents[0]?.uri).toBe(RESOURCES_NOTES.collection.uri);
    });

    it("should declare the json mime type it promises in the listing", async () => {
      const result: ReadResourceResult = await harness.client.readResource({
        uri: RESOURCES_NOTES.collection.uri,
      });

      expect(result.contents[0]?.mimeType).toBe(MIME_TYPES.json);
    });

    it("should serialize the whole collection as parseable json", async () => {
      await seedNote();

      const result: ReadResourceResult = await harness.client.readResource({
        uri: RESOURCES_NOTES.collection.uri,
      });

      const payload = JSON.parse(readText(result)) as CollectionPayload;

      expect(payload.total).toBe(1);
      expect(payload.notes[0]?.title).toBe(mockCreateNoteInput.title);
    });

    it("should report an empty collection instead of failing", async () => {
      const result: ReadResourceResult = await harness.client.readResource({
        uri: RESOURCES_NOTES.collection.uri,
      });

      const payload = JSON.parse(readText(result)) as CollectionPayload;

      expect(payload.total).toBe(0);
      expect(payload.notes).toEqual([]);
    });
  });

  describe(RESOURCES_NOTES.item.name, () => {
    it("should read a single note through the template", async () => {
      const id: number = await seedNote();

      const result: ReadResourceResult = await harness.client.readResource({
        uri: `notes://${String(id)}`,
      });

      expect((JSON.parse(readText(result)) as NoteOutput).title).toBe(mockCreateNoteInput.title);
    });

    it("should echo back the requested uri", async () => {
      const id: number = await seedNote();

      const result: ReadResourceResult = await harness.client.readResource({
        uri: `notes://${String(id)}`,
      });

      expect(result.contents[0]?.uri).toBe(`notes://${String(id)}`);
    });

    it("should enumerate the stored notes as resource instances", async () => {
      const id: number = await seedNote();

      const { resources } = await harness.client.listResources();

      const instance = resources.find(
        (resource: Resource) => resource.uri === `notes://${String(id)}`
      );

      expect(instance?.name).toBe(mockCreateNoteInput.title);
    });

    it("should enumerate one instance per stored note", async () => {
      await seedNote();
      await seedNote(mockSecondNoteInput);

      const { resources } = await harness.client.listResources();

      const instances = resources.filter((resource: Resource) =>
        /^notes:\/\/\d+$/.test(resource.uri)
      );

      expect(instances).toHaveLength(2);
    });

    it("should reject reading a note that does not exist", async () => {
      await expect(harness.client.readResource({ uri: "notes://999" })).rejects.toThrow();
    });

    it("should reject a malformed id in the uri", async () => {
      await expect(harness.client.readResource({ uri: "notes://abc" })).rejects.toThrow();
    });

    it("should reject an unknown uri scheme", async () => {
      await expect(harness.client.readResource({ uri: "unknown://all" })).rejects.toThrow();
    });
  });
});
