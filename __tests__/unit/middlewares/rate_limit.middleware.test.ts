import type { NextFunction, Request, RequestHandler, Response } from "express";

import { rateLimiter } from "@/middlewares/rate_limit.middleware";

interface RateLimitModule {
  rateLimiter: RequestHandler;
}

interface ResponseProbe {
  res: Response;
  status: jest.Mock;
  setHeader: jest.Mock;
}

const buildRequest = (): Request => ({}) as unknown as Request;

const buildResponse = (): ResponseProbe => {
  const status = jest.fn();
  const setHeader = jest.fn();

  const res = { status, setHeader } as unknown as Response;

  status.mockReturnValue(res);
  setHeader.mockReturnValue(res);

  return { res, status, setHeader };
};

const loadRateLimiterWith = (max: number): RequestHandler => {
  jest.resetModules();

  jest.doMock("@/configs/env.config", () => ({
    envs: { RATE_LIMIT_MAX: max, RATE_LIMIT_WINDOW_MS: 60_000 },
    isProduction: (): boolean => false,
    isTest: (): boolean => true,
  }));

  return jest.requireActual<RateLimitModule>("@/middlewares/rate_limit.middleware").rateLimiter;
};

describe("rate_limit.middleware", () => {
  let mockNext: NextFunction;

  beforeEach(() => {
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.dontMock("@/configs/env.config");
    jest.resetModules();
  });

  describe("when no maximum is configured", () => {
    it("should forward every request", () => {
      rateLimiter(buildRequest(), buildResponse().res, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it("should not touch the response", () => {
      const response: ResponseProbe = buildResponse();

      rateLimiter(buildRequest(), response.res, mockNext);

      expect(response.setHeader).not.toHaveBeenCalled();
    });

    it("should not build a real limiter", () => {
      expect(loadRateLimiterWith(0)).not.toHaveProperty("resetKey");
    });
  });

  describe("when a maximum is configured", () => {
    it("should build a real limiter", () => {
      expect(loadRateLimiterWith(5)).toHaveProperty("resetKey");
    });
  });
});
