import { ResourceTemplate, type McpServer } from "@modelcontextprotocol/server";

import { MIME_TYPES, RESOURCES_NOTES } from "@/constants/resources.constant";

import { NoteResourceHandler } from "@/handlers/resources/note.resource";

export const registerResources = (server: McpServer): void => {
  server.registerResource(
    RESOURCES_NOTES.collection.name,
    RESOURCES_NOTES.collection.uri,
    {
      title: "All notes",
      description: "The full note collection as a single JSON document.",
      mimeType: MIME_TYPES.json,
    },
    (uri) => NoteResourceHandler.readCollection(uri)
  );

  server.registerResource(
    RESOURCES_NOTES.item.name,
    new ResourceTemplate(RESOURCES_NOTES.item.template, {
      list: (): ReturnType<typeof NoteResourceHandler.list> => NoteResourceHandler.list(),
    }),
    {
      title: "Note",
      description: "A single note addressed by its numeric id.",
      mimeType: MIME_TYPES.json,
    },
    (uri, variables) => NoteResourceHandler.readItem(uri, variables)
  );
};
