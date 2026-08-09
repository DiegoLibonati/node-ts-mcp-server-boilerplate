import pino from "pino";

import { envs, isProduction } from "@/configs/env.config";

const destination = pino.destination({ dest: 2, sync: false });

export const logger = isProduction()
  ? pino(
      {
        level: envs.LOG_LEVEL,
        base: {
          service: envs.MCP_SERVER_NAME,
          version: envs.MCP_SERVER_VERSION,
        },
        formatters: {
          level: (label) => ({ level: label }),
        },
      },
      destination
    )
  : pino({
      level: envs.LOG_LEVEL,
      base: { service: envs.MCP_SERVER_NAME },
      transport: {
        target: "pino-pretty",
        options: {
          destination: 2,
          colorize: true,
          translateTime: "SYS:HH:MM:ss",
          ignore: "pid,hostname",
        },
      },
    });
