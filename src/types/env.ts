export type NodeEnv = "development" | "production" | "test";

export type LogLevel = "fatal" | "error" | "warn" | "info" | "debug" | "trace" | "silent";

export type TransportKind = "stdio" | "http";

export interface Envs {
  NODE_ENV: NodeEnv;
  LOG_LEVEL: LogLevel;

  MCP_SERVER_NAME: string;
  MCP_SERVER_VERSION: string;
  MCP_TRANSPORT: TransportKind;

  HTTP_HOST: string;
  HTTP_PORT: number;
  HTTP_PATH: string;
  ALLOWED_HOSTS: string[];
  ALLOWED_ORIGINS: string[];
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX: number;

  AUTH_ENABLED: boolean;
  AUTH_TOKEN: string;

  SEED_DEFAULT_DATA: boolean;
}
