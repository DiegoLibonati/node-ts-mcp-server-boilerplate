import type { NextFunction, Request, Response } from "express";

import { envs } from "@/configs/env.config";

import { MESSAGES_NOT } from "@/constants/messages.constant";

import { auth } from "@/middlewares/auth.middleware";

interface ResponseProbe {
  res: Response;
  status: jest.Mock;
  set: jest.Mock;
  json: jest.Mock;
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

const VALID_TOKEN = "valid-token";

const buildRequest = (header?: string): Request =>
  ({
    header: jest.fn().mockReturnValue(header),
    path: "/mcp",
  }) as unknown as Request;

const buildResponse = (): ResponseProbe => {
  const status = jest.fn();
  const set = jest.fn();
  const json = jest.fn();

  const res = { status, set, json } as unknown as Response;

  status.mockReturnValue(res);
  set.mockReturnValue(res);
  json.mockReturnValue(res);

  return { res, status, set, json };
};

describe("auth.middleware", () => {
  let mockNext: NextFunction;

  beforeEach(() => {
    mockNext = jest.fn();
  });

  describe("when authentication is disabled", () => {
    beforeEach(() => {
      jest.replaceProperty(envs, "AUTH_ENABLED", false);
    });

    it("should let the request through", () => {
      auth(buildRequest(), buildResponse().res, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it("should not answer the request itself", () => {
      const response: ResponseProbe = buildResponse();

      auth(buildRequest(), response.res, mockNext);

      expect(response.status).not.toHaveBeenCalled();
    });
  });

  describe("when authentication is enabled", () => {
    beforeEach(() => {
      jest.replaceProperty(envs, "AUTH_ENABLED", true);
      jest.replaceProperty(envs, "AUTH_TOKEN", VALID_TOKEN);
    });

    it("should let a request carrying the expected bearer token through", () => {
      auth(buildRequest(`Bearer ${VALID_TOKEN}`), buildResponse().res, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it.each<[string | undefined, string]>([
      [undefined, "no authorization header"],
      ["", "an empty header"],
      ["Bearer wrong-token", "a wrong token"],
      ["Basic dXNlcjpwYXNz", "a non-bearer scheme"],
      ["bearer valid-token", "a lowercase scheme"],
      [VALID_TOKEN, "a bare token without the scheme"],
    ])("should answer 401 to %p (%s)", (header: string | undefined) => {
      const response: ResponseProbe = buildResponse();

      auth(buildRequest(header), response.res, mockNext);

      expect(response.status).toHaveBeenCalledWith(401);
    });

    it("should stop the request instead of forwarding it", () => {
      auth(buildRequest("Bearer wrong-token"), buildResponse().res, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should send a bearer challenge alongside the rejection", () => {
      const response: ResponseProbe = buildResponse();

      auth(buildRequest("Bearer wrong-token"), response.res, mockNext);

      expect(response.set).toHaveBeenCalledWith(
        "www-authenticate",
        expect.stringContaining("Bearer") as string
      );
    });

    it("should explain the rejection in the body", () => {
      const response: ResponseProbe = buildResponse();

      auth(buildRequest("Bearer wrong-token"), response.res, mockNext);

      expect(response.json).toHaveBeenCalledWith({ error: MESSAGES_NOT.authorized });
    });
  });
});
