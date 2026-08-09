import type { Code } from "@/types/constants";

import { CODES_ERROR } from "@/constants/codes.constant";

export class AppError extends Error {
  public readonly code: Code;
  public readonly isOperational: boolean;

  constructor(message: string, code: Code = CODES_ERROR.generic, isOperational = true) {
    super(message);

    this.name = new.target.name;
    this.code = code;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, new.target);
  }
}
