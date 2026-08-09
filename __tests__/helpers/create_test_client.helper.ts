import {
  Client,
  InMemoryTransport,
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";
import { createMcpHandler } from "@modelcontextprotocol/server";

import type { Implementation } from "@modelcontextprotocol/client";

import { createMcpServer } from "@/mcp";

export interface TestHarness {
  client: Client;
  close: () => Promise<void>;
}

const TEST_CLIENT_INFO: Implementation = { name: "test-client", version: "1.0.0" };

const TEST_ENDPOINT = "http://mcp.test.local/mcp";

export const createTestClient = async (): Promise<TestHarness> => {
  const server = createMcpServer();
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  const client = new Client(TEST_CLIENT_INFO);

  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

  return {
    client,
    close: async (): Promise<void> => {
      await client.close();
      await server.close();
    },
  };
};

export const createHttpTestClient = async (): Promise<TestHarness> => {
  const handler = createMcpHandler(() => createMcpServer(), { legacy: "stateless" });

  const transport = new StreamableHTTPClientTransport(new URL(TEST_ENDPOINT), {
    fetch: (url, init) => handler.fetch(new Request(url, init)),
  });

  const client = new Client(TEST_CLIENT_INFO);

  await client.connect(transport);

  return {
    client,
    close: async (): Promise<void> => {
      await client.close();
      await handler.close();
    },
  };
};
