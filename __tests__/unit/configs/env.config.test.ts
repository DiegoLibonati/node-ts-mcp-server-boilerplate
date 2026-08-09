import type { Envs } from "@/types/env";

interface EnvConfigModule {
  envs: Envs;
  isProduction: () => boolean;
  isTest: () => boolean;
}

jest.mock("dotenv", () => ({
  config: jest.fn(),
}));

const loadEnvConfig = (): EnvConfigModule =>
  jest.requireActual<EnvConfigModule>("@/configs/env.config");

describe("env.config", () => {
  const originalEnv: NodeJS.ProcessEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("defaults", () => {
    it("should default the transport to stdio", () => {
      delete process.env.MCP_TRANSPORT;

      expect(loadEnvConfig().envs.MCP_TRANSPORT).toBe("stdio");
    });

    it("should default the http port", () => {
      delete process.env.HTTP_PORT;

      expect(loadEnvConfig().envs.HTTP_PORT).toBe(5060);
    });

    it("should default the http host to the loopback address", () => {
      delete process.env.HTTP_HOST;

      expect(loadEnvConfig().envs.HTTP_HOST).toBe("127.0.0.1");
    });

    it("should default the http path", () => {
      delete process.env.HTTP_PATH;

      expect(loadEnvConfig().envs.HTTP_PATH).toBe("/mcp");
    });

    it("should default the environment to development", () => {
      delete process.env.NODE_ENV;

      expect(loadEnvConfig().envs.NODE_ENV).toBe("development");
    });

    it("should default the allowed hosts to the local ones", () => {
      delete process.env.ALLOWED_HOSTS;

      expect(loadEnvConfig().envs.ALLOWED_HOSTS).toEqual(["localhost", "127.0.0.1"]);
    });

    it("should default the allowed origins to an empty allowlist", () => {
      delete process.env.ALLOWED_ORIGINS;

      expect(loadEnvConfig().envs.ALLOWED_ORIGINS).toEqual([]);
    });

    it("should default authentication to disabled", () => {
      delete process.env.AUTH_ENABLED;

      expect(loadEnvConfig().envs.AUTH_ENABLED).toBe(false);
    });

    it("should default seeding to disabled", () => {
      delete process.env.SEED_DEFAULT_DATA;

      expect(loadEnvConfig().envs.SEED_DEFAULT_DATA).toBe(false);
    });

    it("should default the rate limit to unlimited", () => {
      delete process.env.RATE_LIMIT_MAX;

      expect(loadEnvConfig().envs.RATE_LIMIT_MAX).toBe(0);
    });
  });

  describe("coercions", () => {
    it("should coerce a numeric string port into a number", () => {
      process.env.HTTP_PORT = "9000";

      expect(loadEnvConfig().envs.HTTP_PORT).toBe(9000);
    });

    it("should split the allowed hosts on commas", () => {
      process.env.ALLOWED_HOSTS = " localhost , mcp.internal ";

      expect(loadEnvConfig().envs.ALLOWED_HOSTS).toEqual(["localhost", "mcp.internal"]);
    });

    it("should turn the authentication flag into a boolean", () => {
      process.env.AUTH_ENABLED = "true";
      process.env.AUTH_TOKEN = "a-token";

      expect(loadEnvConfig().envs.AUTH_ENABLED).toBe(true);
    });

    it("should turn the seeding flag into a boolean", () => {
      process.env.SEED_DEFAULT_DATA = "true";

      expect(loadEnvConfig().envs.SEED_DEFAULT_DATA).toBe(true);
    });
  });

  describe("validation", () => {
    it("should refuse to start with an unknown transport", () => {
      process.env.MCP_TRANSPORT = "carrier-pigeon";

      expect(() => loadEnvConfig()).toThrow(/MCP_TRANSPORT/);
    });

    it("should refuse to start with a non numeric port", () => {
      process.env.HTTP_PORT = "not-a-number";

      expect(() => loadEnvConfig()).toThrow(/HTTP_PORT/);
    });

    it("should refuse to start with a port outside the valid range", () => {
      process.env.HTTP_PORT = "70000";

      expect(() => loadEnvConfig()).toThrow(/HTTP_PORT/);
    });

    it("should refuse to start with a path that is not rooted", () => {
      process.env.HTTP_PATH = "mcp";

      expect(() => loadEnvConfig()).toThrow(/HTTP_PATH/);
    });

    it("should refuse to start with an unknown log level", () => {
      process.env.LOG_LEVEL = "verbose";

      expect(() => loadEnvConfig()).toThrow(/LOG_LEVEL/);
    });

    it("should refuse to start when authentication is enabled without a token", () => {
      process.env.AUTH_ENABLED = "true";
      process.env.AUTH_TOKEN = "";

      expect(() => loadEnvConfig()).toThrow(/AUTH_TOKEN/);
    });

    it("should list every offending key in a single error", () => {
      process.env.HTTP_PORT = "not-a-number";
      process.env.MCP_TRANSPORT = "carrier-pigeon";

      expect(() => loadEnvConfig()).toThrow(/HTTP_PORT/);
      expect(() => loadEnvConfig()).toThrow(/MCP_TRANSPORT/);
    });
  });

  describe("environment predicates", () => {
    it("should report a production environment", () => {
      process.env.NODE_ENV = "production";

      const config: EnvConfigModule = loadEnvConfig();

      expect(config.isProduction()).toBe(true);
      expect(config.isTest()).toBe(false);
    });

    it("should report a test environment", () => {
      process.env.NODE_ENV = "test";

      const config: EnvConfigModule = loadEnvConfig();

      expect(config.isTest()).toBe(true);
      expect(config.isProduction()).toBe(false);
    });
  });
});
