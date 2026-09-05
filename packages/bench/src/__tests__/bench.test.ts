import { describe, it, expect } from "vitest";
import { createBenchmark } from "../index.js";
import { McpSession } from "@yumdee/mcp-studio-core";

describe("Benchmark & Compliance Scoring", () => {
  const sampleSession: McpSession = {
    id: "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
    serverInfo: {
      name: "math-server",
      version: "0.1.0",
      transport: "stdio",
    },
    clientInfo: {
      name: "yumdee-mcp-studio",
      version: "0.1.0",
    },
    startedAt: new Date().toISOString(),
    events: [
      {
        type: "request",
        timestamp: new Date().toISOString(),
        id: 1,
        method: "initialize",
        sentAtMs: 0,
      },
      {
        type: "response",
        timestamp: new Date().toISOString(),
        id: 1,
        result: { capabilities: {} },
        receivedAtMs: 15,
        latencyMs: 15,
      },
      {
        type: "request",
        timestamp: new Date().toISOString(),
        id: 2,
        method: "tools/call",
        sentAtMs: 20,
      },
      {
        type: "response",
        timestamp: new Date().toISOString(),
        id: 2,
        result: { content: [{ type: "text", text: "result" }] },
        receivedAtMs: 45,
        latencyMs: 25,
      },
    ],
  };

  it("should score a compliant session highly", () => {
    const bench = createBenchmark({ minScore: 80 });
    const score = bench.scoreSession(sampleSession);

    expect(score.overall).toBeGreaterThanOrEqual(80);
    expect(score.breakdown.specCompliance).toBeGreaterThanOrEqual(80);
    expect(score.breakdown.successRate).toBe(1.0);
    expect(score.breakdown.errorCount).toBe(0);
    expect(score.breakdown.latencyPercentile50).toBeGreaterThan(0);

    const report = bench.generateReport(score);
    expect(report).toContain("MCP Studio Compliance Report");
    expect(report).toContain("PASSED");
  });

  it("should detect regressions when errors or latencies increase", () => {
    const degradedSession: McpSession = {
      ...sampleSession,
      id: "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f",
      events: [
        ...sampleSession.events,
        {
          type: "request",
          timestamp: new Date().toISOString(),
          id: 3,
          method: "tools/call",
          sentAtMs: 50,
        },
        {
          type: "response",
          timestamp: new Date().toISOString(),
          id: 3,
          error: { code: -32603, message: "Internal failure" },
          receivedAtMs: 350,
          latencyMs: 300,
        },
      ],
    };

    const bench = createBenchmark();
    const regressions = bench.detectRegressions(sampleSession, degradedSession);

    expect(regressions.length).toBeGreaterThan(0);
    const errorRegression = regressions.find((r) => r.field === "errorCount");
    expect(errorRegression).toBeDefined();
    expect(errorRegression?.severity).toBe("error");
  });
});
