import type { NextFunction, Request, Response } from "express";

import { envs } from "@/configs/env.config";
import { logger } from "@/configs/logger.config";

export const originValidation = (req: Request, res: Response, next: NextFunction): void => {
  if (envs.ALLOWED_ORIGINS.length === 0) {
    next();
    return;
  }

  const origin = req.header("origin");

  if (origin === undefined) {
    next();
    return;
  }

  if (!envs.ALLOWED_ORIGINS.includes(origin)) {
    logger.warn({ origin }, "rejected request from disallowed origin");
    res.status(403).json({ error: "Origin not allowed." });
    return;
  }

  res.setHeader("access-control-allow-origin", origin);
  res.setHeader("access-control-allow-headers", "content-type, authorization, mcp-session-id");
  res.setHeader("access-control-expose-headers", "mcp-session-id, x-request-id");

  next();
};
