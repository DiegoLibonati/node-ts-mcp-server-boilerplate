export type Note = {
  id: number;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type CreateNoteData = {
  title: string;
  content: string;
  tags?: string[];
};

export type UpdateNoteData = {
  title?: string;
  content?: string;
  tags?: string[];
};
