import type { NextFunction, Request, Response } from "express";

import { requestId } from "@/middlewares/request_id.middleware";

interface ResponseProbe {
  res: Response;
  setHeader: jest.Mock;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const INCOMING_ID = "incoming-request-id";

const buildRequest = (header?: string): Request =>
  ({
    header: jest.fn().mockReturnValue(header),
  }) as unknown as Request;

const buildResponse = (): ResponseProbe => {
  const setHeader = jest.fn();

  const res = { locals: {}, setHeader } as unknown as Response;

  setHeader.mockReturnValue(res);

  return { res, setHeader };
};

describe("request_id.middleware", () => {
  let mockNext: NextFunction;

  beforeEach(() => {
    mockNext = jest.fn();
  });

  it("should always forward the request", () => {
    requestId(buildRequest(), buildResponse().res, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it("should generate a uuid when the client sent no correlation id", () => {
    const response: ResponseProbe = buildResponse();

    requestId(buildRequest(), response.res, mockNext);

    expect(response.res.locals.requestId).toMatch(UUID_PATTERN);
  });

  it("should echo the generated id back in the response header", () => {
    const response: ResponseProbe = buildResponse();

    requestId(buildRequest(), response.res, mockNext);

    expect(response.setHeader).toHaveBeenCalledWith("x-request-id", response.res.locals.requestId);
  });

  it("should reuse the correlation id sent by the client", () => {
    const response: ResponseProbe = buildResponse();

    requestId(buildRequest(INCOMING_ID), response.res, mockNext);

    expect(response.res.locals.requestId).toBe(INCOMING_ID);
  });

  it("should generate a new id when the incoming header is empty", () => {
    const response: ResponseProbe = buildResponse();

    requestId(buildRequest(""), response.res, mockNext);

    expect(response.res.locals.requestId).toMatch(UUID_PATTERN);
  });

  it("should generate a different id on every request", () => {
    const first: ResponseProbe = buildResponse();
    const second: ResponseProbe = buildResponse();

    requestId(buildRequest(), first.res, mockNext);
    requestId(buildRequest(), second.res, mockNext);

    expect(first.res.locals.requestId).not.toBe(second.res.locals.requestId);
  });
});
