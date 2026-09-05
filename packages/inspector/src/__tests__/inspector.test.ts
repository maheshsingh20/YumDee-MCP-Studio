import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createInspector, Inspector } from "../server.js";
import { InMemoryStorage } from "@yumdee/mcp-studio-core";
import * as path from "path";

describe("Inspector Server API", () => {
  let inspector: Inspector;
  const port = 3899;
  const baseUrl = `http://localhost:${port}`;
  const serverPath = path.resolve(__dirname, "../../../../examples/math-server/dist/index.js");

  beforeAll(async () => {
    inspector = createInspector({
      port,
      storage: new InMemoryStorage(),
    });
    await inspector.start();
  });

  afterAll(async () => {
    await inspector.stop();
  });

  it("should respond to health check", async () => {
    const res = await fetch(baseUrl);
    const data: any = await res.json();
    expect(data.status).toBe("running");
  });

  it("should connect to math-server and return tools", async () => {
    const connectRes = await fetch(`${baseUrl}/api/servers/connect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transport: "stdio",
        command: "node",
        args: [serverPath],
      }),
    });

    const connectData: any = await connectRes.json();
    expect(connectRes.status).toBe(200);
    expect(connectData.serverInfo.name).toBe("math-server");
    expect(connectData.tools.length).toBeGreaterThan(0);

    const sessionId = connectData.sessionId;

    // Test invoking a tool
    const invokeRes = await fetch(`${baseUrl}/api/servers/${sessionId}/invoke`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        toolName: "multiply",
        args: { a: 6, b: 7 },
      }),
    });

    const invokeData: any = await invokeRes.json();
    expect(invokeData.success).toBe(true);
    expect(invokeData.result.content[0].text).toContain("42");
    expect(invokeData.latencyMs).toBeGreaterThanOrEqual(0);

    // Test save session
    const saveRes = await fetch(`${baseUrl}/api/sessions/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    const saveData: any = await saveRes.json();
    expect(saveData.success).toBe(true);

    // Disconnect
    await fetch(`${baseUrl}/api/servers/${sessionId}/disconnect`, { method: "POST" });
  });
});
