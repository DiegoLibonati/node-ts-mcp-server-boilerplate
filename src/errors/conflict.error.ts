import { CODES_NOT } from "@/constants/codes.constant";

import { AppError } from "@/errors/app.error";

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, CODES_NOT.unique);
  }
}
