import { randomUUID } from "node:crypto";

import type { NextFunction, Request, Response } from "express";

export const requestId = (req: Request, res: Response, next: NextFunction): void => {
  const incoming = req.header("x-request-id");
  const id = incoming && incoming.length > 0 ? incoming : randomUUID();

  res.setHeader("x-request-id", id);
  res.locals.requestId = id;

  next();
};
