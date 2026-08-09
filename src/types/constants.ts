export interface CodesNot {
  found: "NOT_FOUND";
  valid: "NOT_VALID";
  unique: "NOT_UNIQUE";
  authorized: "NOT_AUTHORIZED";
}

export interface CodesError {
  generic: "ERROR_GENERIC";
}

export type Code = CodesNot[keyof CodesNot] | CodesError[keyof CodesError];

export interface MessagesSuccess {
  createNote: string;
  updateNote: string;
  deleteNote: string;
}

export interface MessagesNot {
  foundNote: string;
  uniqueTitle: string;
  validUpdate: string;
  authorized: string;
}

export interface MessagesError {
  generic: string;
}

export interface ToolsHealth {
  check: "health_check";
}

export interface ToolsNotes {
  list: "notes_list";
  get: "notes_get";
  create: "notes_create";
  update: "notes_update";
  delete: "notes_delete";
}

export type ToolName = ToolsHealth[keyof ToolsHealth] | ToolsNotes[keyof ToolsNotes];

export interface PromptsNotes {
  summarize: "summarize_notes";
}

export type PromptName = PromptsNotes[keyof PromptsNotes];

export interface ResourceEntry {
  name: string;
  uri: string;
}

export interface ResourceTemplateEntry {
  name: string;
  template: string;
}

export interface ResourcesNotes {
  collection: ResourceEntry;
  item: ResourceTemplateEntry;
}

export interface MimeTypes {
  json: "application/json";
  text: "text/plain";
  markdown: "text/markdown";
}
