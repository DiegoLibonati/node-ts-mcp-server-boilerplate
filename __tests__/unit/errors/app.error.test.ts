import type { Code } from "@/types/constants";

import { CODES_ERROR, CODES_NOT } from "@/constants/codes.constant";

import { AppError } from "@/errors/app.error";
import { BadRequestError } from "@/errors/bad_request.error";
import { ConflictError } from "@/errors/conflict.error";
import { NotFoundError } from "@/errors/not_found.error";
import { UnauthorizedError } from "@/errors/unauthorized.error";

describe("app.error", () => {
  describe("AppError", () => {
    it("should behave like a native error", () => {
      expect(new AppError("broken")).toBeInstanceOf(Error);
    });

    it("should keep the message it was given", () => {
      expect(new AppError("broken").message).toBe("broken");
    });

    it("should default to the generic domain code", () => {
      expect(new AppError("broken").code).toBe(CODES_ERROR.generic);
    });

    it("should default to being operational", () => {
      expect(new AppError("broken").isOperational).toBe(true);
    });

    it("should accept a non-operational flag", () => {
      expect(new AppError("broken", CODES_ERROR.generic, false).isOperational).toBe(false);
    });

    it("should name itself after its own class", () => {
      expect(new AppError("broken").name).toBe("AppError");
    });

    it("should capture a stack trace", () => {
      expect(new AppError("broken").stack).toBeTruthy();
    });
  });

  describe("subclasses", () => {
    it.each<[string, AppError, Code]>([
      ["NotFoundError", new NotFoundError("missing"), CODES_NOT.found],
      ["ConflictError", new ConflictError("taken"), CODES_NOT.unique],
      ["BadRequestError", new BadRequestError("invalid"), CODES_NOT.valid],
      ["UnauthorizedError", new UnauthorizedError("denied"), CODES_NOT.authorized],
    ])(
      "%s should carry its own name and domain code",
      (name: string, error: AppError, code: Code) => {
        expect(error.name).toBe(name);
        expect(error.code).toBe(code);
      }
    );

    it.each<[string, AppError]>([
      ["NotFoundError", new NotFoundError("missing")],
      ["ConflictError", new ConflictError("taken")],
      ["BadRequestError", new BadRequestError("invalid")],
      ["UnauthorizedError", new UnauthorizedError("denied")],
    ])("%s should be an expected failure rather than a bug", (_name: string, error: AppError) => {
      expect(error.isOperational).toBe(true);
    });

    it("should stay recognizable as an AppError", () => {
      expect(new NotFoundError("missing")).toBeInstanceOf(AppError);
    });
  });
});
