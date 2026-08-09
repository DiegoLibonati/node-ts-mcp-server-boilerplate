import type { ExceptionInfo } from "@/types/helpers";

import { CODES_ERROR, CODES_NOT } from "@/constants/codes.constant";
import { MESSAGES_ERROR } from "@/constants/messages.constant";

import { AppError } from "@/errors/app.error";
import { BadRequestError } from "@/errors/bad_request.error";
import { ConflictError } from "@/errors/conflict.error";
import { NotFoundError } from "@/errors/not_found.error";
import { UnauthorizedError } from "@/errors/unauthorized.error";

import { getExceptionMessage } from "@/helpers/get_exception_message.helper";

describe("get_exception_message.helper", () => {
  describe("getExceptionMessage", () => {
    it("should forward the message of a domain error", () => {
      const info: ExceptionInfo = getExceptionMessage(new NotFoundError("Note 5 not found"));

      expect(info.message).toBe("Note 5 not found");
    });

    it("should mark a domain error as operational", () => {
      expect(getExceptionMessage(new NotFoundError("missing")).isOperational).toBe(true);
    });

    it.each<[AppError, string]>([
      [new NotFoundError("missing"), CODES_NOT.found],
      [new ConflictError("taken"), CODES_NOT.unique],
      [new BadRequestError("invalid"), CODES_NOT.valid],
      [new UnauthorizedError("denied"), CODES_NOT.authorized],
    ])("should map %p to the %s code", (error: AppError, code: string) => {
      expect(getExceptionMessage(error).code).toBe(code);
    });

    it("should keep a non-operational domain error out of the operational path", () => {
      const error = new AppError("broken", CODES_ERROR.generic, false);

      expect(getExceptionMessage(error).isOperational).toBe(false);
    });

    it("should collapse an unknown error to the generic code", () => {
      expect(getExceptionMessage(new Error("boom")).code).toBe(CODES_ERROR.generic);
    });

    it("should never leak the message of an unknown error", () => {
      const info: ExceptionInfo = getExceptionMessage(new Error("db password is hunter2"));

      expect(info.message).toBe(MESSAGES_ERROR.generic);
      expect(info.message).not.toContain("hunter2");
    });

    it("should mark an unknown error as a bug rather than an expected failure", () => {
      expect(getExceptionMessage(new Error("boom")).isOperational).toBe(false);
    });

    it.each<[unknown]>([[null], [undefined], ["a string"], [42], [{}], [[]]])(
      "should normalize the thrown value %p",
      (thrown: unknown) => {
        expect(getExceptionMessage(thrown).code).toBe(CODES_ERROR.generic);
      }
    );
  });
});
