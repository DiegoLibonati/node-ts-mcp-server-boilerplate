import type { CreateNoteData, Note } from "@/types/models";
import type {
  CreateNoteInput,
  HealthOutput,
  ListNotesInput,
  NotesListOutput,
  UpdateNoteInput,
} from "@/types/zod";

export const mockCreateNoteInput: CreateNoteInput = {
  title: "Mock note",
  content: "Mock content used across the test suite.",
  tags: ["mock", "test"],
};

export const mockSecondNoteInput: CreateNoteInput = {
  title: "Second mock note",
  content: "Another mock note, tagged differently.",
  tags: ["other"],
};

export const mockCreateNoteData: CreateNoteData = {
  title: mockCreateNoteInput.title,
  content: mockCreateNoteInput.content,
  tags: mockCreateNoteInput.tags,
};

export const mockUpdateNoteInput: UpdateNoteInput = {
  id: 1,
  title: "Renamed mock note",
};

export const mockListNotesInput: ListNotesInput = {
  limit: 20,
  offset: 0,
};

export const mockNote: Note = {
  id: 1,
  title: mockCreateNoteInput.title,
  content: mockCreateNoteInput.content,
  tags: mockCreateNoteInput.tags,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

export const mockSecondNote: Note = {
  id: 2,
  title: mockSecondNoteInput.title,
  content: mockSecondNoteInput.content,
  tags: mockSecondNoteInput.tags,
  createdAt: "2026-01-02T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
};

export const mockNotesListOutput: NotesListOutput = {
  notes: [mockNote],
  total: 1,
  limit: 20,
  offset: 0,
};

export const mockEmptyNotesListOutput: NotesListOutput = {
  notes: [],
  total: 0,
  limit: 100,
  offset: 0,
};

export const mockHealthOutput: HealthOutput = {
  status: "ok",
  name: "mcp-boilerplate",
  version: "1.0.0",
  transport: "stdio",
  uptimeSeconds: 12,
  timestamp: "2026-01-01T00:00:00.000Z",
};
