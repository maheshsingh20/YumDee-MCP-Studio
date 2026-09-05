import { describe, it, expect, afterAll } from "vitest";
import { createStdioClient, McpClient } from "../client/index.js";
import * as path from "path";

describe("StdioMcpClient with math-server", () => {
  let client: McpClient;
  const serverPath = path.resolve(__dirname, "../../../../examples/math-server/dist/index.js");

  afterAll(async () => {
    if (client) {
      await client.disconnect();
    }
  });

  it("should connect, perform handshake, introspect tools, and call tools", async () => {
    client = createStdioClient("node", [serverPath]);
    const info = await client.connect();

    expect(info.name).toBe("math-server");
    expect(info.transport).toBe("stdio");

    const tools = client.getTools();
    expect(tools.length).toBeGreaterThan(0);
    const addTool = tools.find((t) => t.name === "add");
    expect(addTool).toBeDefined();

    // Call a tool using standard MCP format
    const result: any = await client.call("tools/call", {
      name: "add",
      arguments: { a: 15, b: 27 },
    });
    expect(result.content).toBeDefined();
    expect(result.content[0].text).toContain("42");

    // Check session events
    const session = client.getSession();
    expect(session.events.length).toBeGreaterThan(2);

    const callEvent = session.events.find(
      (e) => e.type === "request" && e.method === "tools/call"
    );
    expect(callEvent).toBeDefined();

    const responseEvent = session.events.find(
      (e) => e.type === "response" && (e as any).latencyMs !== undefined
    );
    expect(responseEvent).toBeDefined();
  }, 10000);
});
