import type { MimeTypes, ResourcesNotes } from "@/types/constants";

export const RESOURCE_SCHEME = "notes";

export const RESOURCES_NOTES: ResourcesNotes = {
  collection: {
    name: "notes-collection",
    uri: `${RESOURCE_SCHEME}://all`,
  },
  item: {
    name: "note-item",
    template: `${RESOURCE_SCHEME}://{id}`,
  },
};

export const MIME_TYPES: MimeTypes = {
  json: "application/json",
  text: "text/plain",
  markdown: "text/markdown",
};
