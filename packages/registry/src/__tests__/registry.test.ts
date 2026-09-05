import { describe, it, expect } from "vitest";
import { createRegistry } from "../registry.js";
import * as path from "path";

describe("ServerRegistry", () => {
  it("should load server listings and enable search and filtering", async () => {
    const serversDir = path.resolve(__dirname, "../../../../packages/registry/servers");
    const registry = createRegistry(serversDir);
    await registry.load();

    const all = registry.list();
    expect(all.length).toBeGreaterThanOrEqual(3);

    const fsServer = registry.get("filesystem-mcp");
    expect(fsServer).toBeDefined();
    expect(fsServer?.displayName).toBe("Filesystem Access");

    const searchResults = registry.search("postgres");
    expect(searchResults.length).toBe(1);
    expect(searchResults[0].name).toBe("postgres-mcp");

    const tagged = registry.filterByTag("database");
    expect(tagged.length).toBe(1);
  });
});
