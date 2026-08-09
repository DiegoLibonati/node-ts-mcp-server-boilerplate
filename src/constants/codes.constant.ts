import type { CodesError, CodesNot } from "@/types/constants";

export const CODES_NOT: CodesNot = {
  found: "NOT_FOUND",
  valid: "NOT_VALID",
  unique: "NOT_UNIQUE",
  authorized: "NOT_AUTHORIZED",
};

export const CODES_ERROR: CodesError = {
  generic: "ERROR_GENERIC",
};
