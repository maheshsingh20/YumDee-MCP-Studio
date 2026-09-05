import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { InMemoryStorage, LocalJsonStorage } from "../storage/index.js";
import { parseSession, McpSession } from "../schemas/index.js";
import * as os from "os";
import * as path from "path";
import { promises as fs } from "fs";

describe("McpSession Schema & Storage", () => {
  const mockSession: McpSession = {
    id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    serverInfo: {
      name: "test-server",
      version: "1.0.0",
      transport: "stdio",
      command: "node test.js",
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
        receivedAtMs: 25,
        latencyMs: 25,
      },
    ],
    metadata: {
      tags: ["test", "ci"],
    },
  };

  it("should parse and validate a session", () => {
    const parsed = parseSession(mockSession);
    expect(parsed.id).toBe(mockSession.id);
    expect(parsed.events.length).toBe(2);
  });

  describe("InMemoryStorage", () => {
    it("should save, load, list, and delete sessions", async () => {
      const storage = new InMemoryStorage();
      await storage.save(mockSession);

      const loaded = await storage.load(mockSession.id);
      expect(loaded.id).toBe(mockSession.id);

      const list = await storage.list({ serverName: "test-server" });
      expect(list.length).toBe(1);

      const exported = await storage.export(mockSession.id, "jsonl");
      expect(exported.split("\n").length).toBe(2);

      await storage.delete(mockSession.id);
      await expect(storage.load(mockSession.id)).rejects.toThrow("Session not found");
    });
  });

  describe("LocalJsonStorage", () => {
    const tempDir = path.join(os.tmpdir(), `mcp-test-${Date.now()}`);

    afterEach(async () => {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch {}
    });

    it("should persist session to disk and read it back", async () => {
      const storage = new LocalJsonStorage(tempDir);
      await storage.save(mockSession);

      const loaded = await storage.load(mockSession.id);
      expect(loaded.id).toBe(mockSession.id);
      expect(loaded.events[1].type).toBe("response");

      const filtered = await storage.list({ tags: ["test"] });
      expect(filtered.length).toBe(1);
    });
  });
});
