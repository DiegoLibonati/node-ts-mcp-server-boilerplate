#!/usr/bin/env node
import type { Server } from "node:http";

import { envs } from "@/configs/env.config";
import { logger } from "@/configs/logger.config";

import { NoteDAO } from "@/daos/note.dao";

import { startHttpTransport } from "@/transports/http.transport";
import { startStdioTransport } from "@/transports/stdio.transport";

const bootstrap = (): void => {
  if (envs.SEED_DEFAULT_DATA) NoteDAO.seed();

  if (envs.MCP_TRANSPORT === "stdio") {
    startStdioTransport();
    return;
  }

  const httpServer: Server = startHttpTransport();

  registerShutdownHooks(httpServer);
};

const registerShutdownHooks = (httpServer: Server): void => {
  const shutdown = (signal: string): void => {
    logger.info({ signal }, "shutting down");

    const forceExit = setTimeout(() => {
      logger.error("graceful shutdown timed out, forcing exit");
      process.exit(1);
    }, 10_000);

    forceExit.unref();

    httpServer.close(() => {
      clearTimeout(forceExit);
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => {
    shutdown("SIGTERM");
  });
  process.on("SIGINT", () => {
    shutdown("SIGINT");
  });
};

process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "unhandled rejection");
});

process.on("uncaughtException", (error) => {
  logger.fatal({ err: error }, "uncaught exception");
  process.exit(1);
});

bootstrap();
