import type { NextFunction, Request, Response } from "express";

import { envs } from "@/configs/env.config";

import { originValidation } from "@/middlewares/origin_validation.middleware";

interface ResponseProbe {
  res: Response;
  status: jest.Mock;
  json: jest.Mock;
  setHeader: jest.Mock;
}

jest.mock("@/configs/logger.config", () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    fatal: jest.fn(),
  },
}));

const ALLOWED_ORIGIN = "https://allowed.example";

const buildRequest = (origin?: string): Request =>
  ({
    header: jest.fn().mockReturnValue(origin),
  }) as unknown as Request;

const buildResponse = (): ResponseProbe => {
  const status = jest.fn();
  const json = jest.fn();
  const setHeader = jest.fn();

  const res = { status, json, setHeader } as unknown as Response;

  status.mockReturnValue(res);
  json.mockReturnValue(res);
  setHeader.mockReturnValue(res);

  return { res, status, json, setHeader };
};

describe("origin_validation.middleware", () => {
  let mockNext: NextFunction;

  beforeEach(() => {
    mockNext = jest.fn();
  });

  describe("when no allowlist is configured", () => {
    beforeEach(() => {
      jest.replaceProperty(envs, "ALLOWED_ORIGINS", []);
    });

    it("should let every request through", () => {
      originValidation(buildRequest("https://anything.example"), buildResponse().res, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it("should not add cross-origin headers", () => {
      const response: ResponseProbe = buildResponse();

      originValidation(buildRequest("https://anything.example"), response.res, mockNext);

      expect(response.setHeader).not.toHaveBeenCalled();
    });
  });

  describe("when an allowlist is configured", () => {
    beforeEach(() => {
      jest.replaceProperty(envs, "ALLOWED_ORIGINS", [ALLOWED_ORIGIN]);
    });

    it("should let a request without an origin header through", () => {
      originValidation(buildRequest(undefined), buildResponse().res, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it("should let an allowed origin through", () => {
      originValidation(buildRequest(ALLOWED_ORIGIN), buildResponse().res, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it("should echo the allowed origin back to the browser", () => {
      const response: ResponseProbe = buildResponse();

      originValidation(buildRequest(ALLOWED_ORIGIN), response.res, mockNext);

      expect(response.setHeader).toHaveBeenCalledWith(
        "access-control-allow-origin",
        ALLOWED_ORIGIN
      );
    });

    it("should expose the mcp session header to the browser", () => {
      const response: ResponseProbe = buildResponse();

      originValidation(buildRequest(ALLOWED_ORIGIN), response.res, mockNext);

      expect(response.setHeader).toHaveBeenCalledWith(
        "access-control-expose-headers",
        expect.stringContaining("mcp-session-id") as string
      );
    });

    it("should answer 403 to a disallowed origin", () => {
      const response: ResponseProbe = buildResponse();

      originValidation(buildRequest("https://evil.example"), response.res, mockNext);

      expect(response.status).toHaveBeenCalledWith(403);
    });

    it("should stop a disallowed origin instead of forwarding it", () => {
      originValidation(buildRequest("https://evil.example"), buildResponse().res, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
