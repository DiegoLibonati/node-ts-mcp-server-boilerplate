import type { MessagesError, MessagesNot, MessagesSuccess } from "@/types/constants";

export const MESSAGES_SUCCESS: MessagesSuccess = {
  createNote: "Note created successfully.",
  updateNote: "Note updated successfully.",
  deleteNote: "Note deleted successfully.",
};

export const MESSAGES_NOT: MessagesNot = {
  foundNote: "No note exists with the given id.",
  uniqueTitle: "A note with that title already exists.",
  validUpdate: "Provide at least one field to update.",
  authorized: "Missing or invalid credentials.",
};

export const MESSAGES_ERROR: MessagesError = {
  generic: "An unexpected error occurred while handling the request.",
};
