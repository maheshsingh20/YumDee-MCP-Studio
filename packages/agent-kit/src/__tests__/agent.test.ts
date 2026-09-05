import { describe, it, expect, afterAll } from "vitest";
import { createAgent, Agent } from "../index.js";
import { createStdioClient, McpClient } from "@yumdee/mcp-studio-core";
import * as path from "path";

describe("Agent-Kit Multi-Server Orchestrator", () => {
  let client: McpClient;
  const serverPath = path.resolve(__dirname, "../../../../examples/math-server/dist/index.js");

  afterAll(async () => {
    if (client) {
      await client.disconnect();
    }
  });

  it("should aggregate tools across servers and run an agent loop", async () => {
    client = createStdioClient("node", [serverPath]);
    const agent = createAgent({
      servers: [client],
      model: "mock",
    });

    const answer = await agent.run("Please add two numbers together");
    expect(answer).toContain("42");

    const session = agent.getSession();
    expect(session).toBeDefined();
    expect(session?.metadata?.tags).toContain("agent-run");
    expect(session?.events.length).toBeGreaterThan(0);
  });
});
