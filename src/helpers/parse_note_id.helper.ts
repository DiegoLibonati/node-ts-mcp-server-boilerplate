import { BadRequestError } from "@/errors/bad_request.error";

export const parseNoteId = (raw: string | string[] | undefined): number => {
  const value = Array.isArray(raw) ? raw[0] : raw;

  if (value === undefined || !/^\d+$/.test(value)) {
    throw new BadRequestError(`Invalid note id: "${String(value)}". Expected a positive integer.`);
  }

  return Number.parseInt(value, 10);
};
