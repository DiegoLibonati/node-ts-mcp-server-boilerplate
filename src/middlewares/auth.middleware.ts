import type { NextFunction, Request, Response } from "express";

import { envs } from "@/configs/env.config";
import { logger } from "@/configs/logger.config";

import { MESSAGES_NOT } from "@/constants/messages.constant";

export const auth = (req: Request, res: Response, next: NextFunction): void => {
  if (!envs.AUTH_ENABLED) {
    next();
    return;
  }

  const header = req.header("authorization") ?? "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || token !== envs.AUTH_TOKEN) {
    logger.warn({ path: req.path }, "rejected unauthenticated request");
    res
      .status(401)
      .set("www-authenticate", 'Bearer realm="mcp"')
      .json({ error: MESSAGES_NOT.authorized });
    return;
  }

  next();
};
