import type { ExceptionInfo } from "@/types/helpers";

import { CODES_ERROR } from "@/constants/codes.constant";
import { MESSAGES_ERROR } from "@/constants/messages.constant";

import { AppError } from "@/errors/app.error";

export const getExceptionMessage = (error: unknown): ExceptionInfo => {
  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message,
      isOperational: error.isOperational,
    };
  }

  return {
    code: CODES_ERROR.generic,
    message: MESSAGES_ERROR.generic,
    isOperational: false,
  };
};
