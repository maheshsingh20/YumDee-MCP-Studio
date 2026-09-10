import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createInspector, Inspector } from "../server.js";

describe("Inspector Gemini AI Suite Endpoints", () => {
  let inspector: Inspector;
  const testPort = 3299;

  beforeAll(async () => {
    inspector = createInspector({ port: testPort, host: "localhost" });
    await inspector.start();
  });

  afterAll(async () => {
    await inspector.stop();
  });

  it("POST /api/ai/test validates missing key gracefully", async () => {
    const res = await fetch(`http://localhost:${testPort}/api/ai/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: "" }),
    });

    expect(res.status).toBe(400);
    const data: any = await res.json();
    expect(data.error).toContain("GEMINI_API_KEY is required");
  });

  it("POST /api/audit fails informatively when no server is connected", async () => {
    const res = await fetch(`http://localhost:${testPort}/api/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
    const data: any = await res.json();
    expect(data.error).toContain("No tools available to audit");
  });

  it("POST /api/agent/chat validates required prompt", async () => {
    const res = await fetch(`http://localhost:${testPort}/api/agent/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "" }),
    });

    expect(res.status).toBe(400);
    const data: any = await res.json();
    expect(data.error).toContain("prompt is required");
  });

  it("POST /api/agent/chat requires connected MCP server", async () => {
    const res = await fetch(`http://localhost:${testPort}/api/agent/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "Calculate 5 + 5" }),
    });

    expect(res.status).toBe(400);
    const data: any = await res.json();
    expect(data.error).toContain("No connected MCP servers");
  });
});
