import { createMcpExpressApp } from "@modelcontextprotocol/express";
import { toNodeHandler } from "@modelcontextprotocol/node";
import { createMcpHandler } from "@modelcontextprotocol/server";

import type { Server } from "node:http";
import type express from "express";

import { createMcpServer } from "@/mcp";

import { envs } from "@/configs/env.config";
import { logger } from "@/configs/logger.config";

import { auth } from "@/middlewares/auth.middleware";
import { originValidation } from "@/middlewares/origin_validation.middleware";
import { rateLimiter } from "@/middlewares/rate_limit.middleware";
import { requestId } from "@/middlewares/request_id.middleware";

export const startHttpTransport = (): Server => {
  const app = createMcpExpressApp({
    host: envs.HTTP_HOST,
    allowedHosts: envs.ALLOWED_HOSTS,
  });

  app.use(requestId);
  app.use(originValidation);
  app.use(rateLimiter);
  app.use(auth);

  const handler = createMcpHandler(() => createMcpServer(), {
    legacy: "stateless",
  });

  const nodeHandler = toNodeHandler(handler);

  app.all(envs.HTTP_PATH, (req: express.Request, res: express.Response) => {
    void (async (): Promise<void> => {
      try {
        await nodeHandler(req, res, req.body);
      } catch (error) {
        logger.error({ err: error }, "mcp http handler failed");

        if (!res.headersSent) {
          res.status(500).json({ error: "Internal server error." });
        }
      }
    })();
  });

  app.get("/health", (_req: express.Request, res: express.Response) => {
    res.status(200).json({ status: "ok" });
  });

  const httpServer = app.listen(envs.HTTP_PORT, envs.HTTP_HOST, () => {
    logger.info(
      { host: envs.HTTP_HOST, port: envs.HTTP_PORT, path: envs.HTTP_PATH },
      "MCP server listening over streamable http"
    );
  });

  return httpServer;
};
