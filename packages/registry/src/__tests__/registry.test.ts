import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createRegistry, buildServerConfig, DEFAULT_LISTINGS } from "../registry.js";
import { parseTargetApp, addServerToConfig } from "../cli.js";
import * as path from "path";
import * as os from "os";
import { promises as fs } from "fs";

describe("ServerRegistry", () => {
  it("should initialize with default listings out-of-the-box", () => {
    const registry = createRegistry();
    const list = registry.list();
    expect(list.length).toBeGreaterThanOrEqual(7);

    const fsServer = registry.get("filesystem-mcp");
    expect(fsServer).toBeDefined();
    expect(fsServer?.displayName).toBe("Filesystem Access");

    const everythingServer = registry.get("everything-mcp");
    expect(everythingServer).toBeDefined();
    expect(everythingServer?.tags).toContain("reference");
  });

  it("should load disk listings and enable search and filtering", async () => {
    const serversDir = path.resolve(__dirname, "../../servers");
    const registry = createRegistry(serversDir);
    await registry.load();

    const all = registry.list();
    expect(all.length).toBeGreaterThanOrEqual(7);

    const searchResults = registry.search("postgres");
    expect(searchResults.length).toBeGreaterThanOrEqual(1);
    expect(searchResults[0].name).toBe("postgres-mcp");

    const dbServers = registry.filterByTag("database");
    expect(dbServers.length).toBeGreaterThanOrEqual(2); // postgres and sqlite
  });

  it("should correctly build client configuration", () => {
    const server = DEFAULT_LISTINGS.find((s) => s.name === "everything-mcp")!;
    const config = buildServerConfig(server);
    expect(config.command).toBe("npx");
    expect(config.args).toEqual(["-y", "@modelcontextprotocol/server-everything"]);
    expect(config.env).toEqual({});
  });
});

describe("CLI Helpers & Config Generation", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "mcp-test-"));
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {}
  });

  it("should parse target flags correctly", () => {
    expect(parseTargetApp(["add", "filesystem-mcp"])).toBe("claude");
    expect(parseTargetApp(["add", "filesystem-mcp", "--target", "cursor"])).toBe("cursor");
    expect(parseTargetApp(["add", "filesystem-mcp", "--target=cursor"])).toBe("cursor");
    expect(parseTargetApp(["add", "filesystem-mcp", "--cursor"])).toBe("cursor");
    expect(parseTargetApp(["add", "filesystem-mcp", "--target", "claude"])).toBe("claude");
  });

  it("should write valid JSON config to custom config path", async () => {
    const testConfigPath = path.join(tempDir, "claude_desktop_config.json");
    const server = DEFAULT_LISTINGS.find((s) => s.name === "filesystem-mcp")!;

    await addServerToConfig(server, "claude", testConfigPath);

    const content = await fs.readFile(testConfigPath, "utf-8");
    const parsed = JSON.parse(content);
    expect(parsed.mcpServers).toBeDefined();
    expect(parsed.mcpServers["filesystem-mcp"]).toBeDefined();
    expect(parsed.mcpServers["filesystem-mcp"].command).toBe("npx");
    expect(parsed.mcpServers["filesystem-mcp"].args).toContain("@modelcontextprotocol/server-filesystem");
  });
});
