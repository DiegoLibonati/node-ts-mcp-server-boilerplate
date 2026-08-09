import { NoteDAO } from "@/daos/note.dao";

jest.setTimeout(15_000);

beforeEach((): void => {
  NoteDAO.reset();
});
