/**
 * MCP Server Registry
 *
 * Manages the collection of community-submitted MCP server listings.
 * Listings are JSON files in servers/ directory with built-in default fallbacks.
 */

import { promises as fs } from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

export const ServerListingSchema = z.object({
  name: z.string(),
  displayName: z.string(),
  description: z.string(),
  homepage: z.string().url(),
  repository: z.string().url(),
  transport: z.enum(["stdio", "sse", "http"]),
  command: z.string().optional(),
  endpoint: z.string().optional(),
  author: z.object({
    name: z.string(),
    email: z.string().email().optional(),
    github: z.string().optional(),
  }),
  license: z.string(),
  tags: z.array(z.string()).optional(),
  verified: z.boolean().optional(),
  lastVerified: z.string().datetime().optional(),
});

export type ServerListing = z.infer<typeof ServerListingSchema>;

export const DEFAULT_LISTINGS: ServerListing[] = [
  {
    name: "filesystem-mcp",
    displayName: "Filesystem Access",
    description: "MCP server for safe, sandboxed access to the local filesystem. Read and write files with configurable permissions.",
    homepage: "https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem",
    repository: "https://github.com/modelcontextprotocol/servers",
    transport: "stdio",
    command: "npx -y @modelcontextprotocol/server-filesystem .",
    author: {
      name: "Anthropic",
      github: "modelcontextprotocol",
    },
    license: "MIT",
    tags: ["filesystem", "files", "io"],
    verified: true,
    lastVerified: "2024-01-15T10:00:00Z",
  },
  {
    name: "postgres-mcp",
    displayName: "PostgreSQL Database",
    description: "MCP server for querying PostgreSQL databases. Execute SQL queries, inspect schema, and manage connections.",
    homepage: "https://github.com/modelcontextprotocol/servers/tree/main/src/postgres",
    repository: "https://github.com/modelcontextprotocol/servers",
    transport: "stdio",
    command: "npx -y @modelcontextprotocol/server-postgres",
    author: {
      name: "Anthropic",
      github: "modelcontextprotocol",
    },
    license: "MIT",
    tags: ["database", "sql", "postgres"],
    verified: true,
    lastVerified: "2024-01-15T10:00:00Z",
  },
  {
    name: "github-mcp",
    displayName: "GitHub Integration",
    description: "MCP server for GitHub API access. Search repositories, manage issues/PRs, read source code, and more.",
    homepage: "https://github.com/modelcontextprotocol/servers/tree/main/src/github",
    repository: "https://github.com/modelcontextprotocol/servers",
    transport: "stdio",
    command: "npx -y @modelcontextprotocol/server-github",
    author: {
      name: "Anthropic",
      github: "modelcontextprotocol",
    },
    license: "MIT",
    tags: ["github", "vcs", "api"],
    verified: true,
    lastVerified: "2024-01-15T10:00:00Z",
  },
  {
    name: "everything-mcp",
    displayName: "MCP Reference Everything",
    description: "The official MCP reference server showcasing all protocol features: tools, prompts, resources, sampling, and notifications.",
    homepage: "https://github.com/modelcontextprotocol/servers/tree/main/src/everything",
    repository: "https://github.com/modelcontextprotocol/servers",
    transport: "stdio",
    command: "npx -y @modelcontextprotocol/server-everything",
    author: {
      name: "Anthropic",
      github: "modelcontextprotocol",
    },
    license: "MIT",
    tags: ["reference", "testing", "everything", "tools", "resources", "prompts"],
    verified: true,
    lastVerified: "2024-03-01T10:00:00Z",
  },
  {
    name: "memory-mcp",
    displayName: "Knowledge Graph Memory",
    description: "MCP server implementing persistent graph-based memory storage for conversational context and semantic entities.",
    homepage: "https://github.com/modelcontextprotocol/servers/tree/main/src/memory",
    repository: "https://github.com/modelcontextprotocol/servers",
    transport: "stdio",
    command: "npx -y @modelcontextprotocol/server-memory",
    author: {
      name: "Anthropic",
      github: "modelcontextprotocol",
    },
    license: "MIT",
    tags: ["memory", "knowledge-graph", "storage", "context"],
    verified: true,
    lastVerified: "2024-03-01T10:00:00Z",
  },
  {
    name: "fetch-mcp",
    displayName: "Web Fetch & HTML Parser",
    description: "MCP server to fetch web content and convert HTML pages into clean markdown for LLM ingestion.",
    homepage: "https://github.com/modelcontextprotocol/servers/tree/main/src/fetch",
    repository: "https://github.com/modelcontextprotocol/servers",
    transport: "stdio",
    command: "npx -y @modelcontextprotocol/server-fetch",
    author: {
      name: "Anthropic",
      github: "modelcontextprotocol",
    },
    license: "MIT",
    tags: ["fetch", "web", "html", "markdown", "http"],
    verified: true,
    lastVerified: "2024-03-01T10:00:00Z",
  },
  {
    name: "sqlite-mcp",
    displayName: "SQLite Database Explorer",
    description: "MCP server for querying and inspecting local SQLite databases, running read queries, and inspecting table schemas.",
    homepage: "https://github.com/modelcontextprotocol/servers/tree/main/src/sqlite",
    repository: "https://github.com/modelcontextprotocol/servers",
    transport: "stdio",
    command: "npx -y @modelcontextprotocol/server-sqlite --db-path ./test.db",
    author: {
      name: "Anthropic",
      github: "modelcontextprotocol",
    },
    license: "MIT",
    tags: ["database", "sqlite", "sql", "storage"],
    verified: true,
    lastVerified: "2024-03-01T10:00:00Z",
  },
];

/**
 * Builds the MCP configuration entry for Claude Desktop or Cursor
 */
export function buildServerConfig(server: ServerListing): {
  command: string;
  args: string[];
  env: Record<string, string>;
} {
  let command = server.command || "npx";
  let args: string[] = [];
  if (server.command && server.command.includes(" ")) {
    const parts = server.command.split(" ");
    command = parts[0];
    args = parts.slice(1);
  }
  return {
    command,
    args,
    env: {},
  };
}

/**
 * Registry class - loads and queries server listings
 */
export class ServerRegistry {
  private listings: Map<string, ServerListing> = new Map();
  private serversDir?: string;

  constructor(serversDir?: string) {
    this.serversDir = serversDir;
    // Pre-populate with default listings so registry never returns 0 results
    for (const listing of DEFAULT_LISTINGS) {
      this.listings.set(listing.name, listing);
    }
  }

  /**
   * Load listings from the registry directory (merging/overriding defaults)
   */
  async load(): Promise<void> {
    const candidates: string[] = [];

    if (this.serversDir) {
      candidates.push(path.resolve(this.serversDir));
    }

    // Resolve relative to module location
    try {
      const currentDir = path.dirname(fileURLToPath(import.meta.url));
      candidates.push(path.resolve(currentDir, "../servers"));
      candidates.push(path.resolve(currentDir, "../../servers"));
      candidates.push(path.resolve(process.cwd(), "packages/registry/servers"));
      candidates.push(path.resolve(process.cwd(), "servers"));
    } catch {
      candidates.push(path.resolve(process.cwd(), "packages/registry/servers"));
    }

    let targetDir: string | null = null;
    for (const dir of candidates) {
      try {
        const stat = await fs.stat(dir);
        if (stat.isDirectory()) {
          targetDir = dir;
          break;
        }
      } catch {}
    }

    if (!targetDir) {
      return;
    }

    try {
      const files = await fs.readdir(targetDir);
      for (const file of files) {
        if (!file.endsWith(".json")) continue;
        try {
          const filePath = path.join(targetDir, file);
          const content = await fs.readFile(filePath, "utf8");
          const parsed = ServerListingSchema.parse(JSON.parse(content));
          this.listings.set(parsed.name, parsed);
        } catch (err) {
          console.warn(`Warning: failed to load server listing from ${file}:`, err);
        }
      }
    } catch (err) {
      console.warn(`Warning: failed reading directory ${targetDir}:`, err);
    }
  }

  /**
   * Get a server listing by name
   */
  get(name: string): ServerListing | undefined {
    return this.listings.get(name);
  }

  /**
   * Manually register or overwrite a server listing
   */
  register(listing: ServerListing): void {
    const validated = ServerListingSchema.parse(listing);
    this.listings.set(validated.name, validated);
  }

  /**
   * Search for servers by keyword (name, displayName, description, tags)
   */
  search(keyword: string): ServerListing[] {
    const lowerKeyword = keyword.toLowerCase();
    return Array.from(this.listings.values()).filter(
      (listing) =>
        listing.name.toLowerCase().includes(lowerKeyword) ||
        listing.displayName.toLowerCase().includes(lowerKeyword) ||
        listing.description.toLowerCase().includes(lowerKeyword) ||
        listing.tags?.some((tag) => tag.toLowerCase().includes(lowerKeyword))
    );
  }

  /**
   * List all servers
   */
  list(): ServerListing[] {
    return Array.from(this.listings.values());
  }

  /**
   * Get servers by tag
   */
  filterByTag(tag: string): ServerListing[] {
    const lower = tag.toLowerCase();
    return Array.from(this.listings.values()).filter((listing) =>
      listing.tags?.some((t) => t.toLowerCase() === lower)
    );
  }
}

export function createRegistry(serversDir?: string): ServerRegistry {
  return new ServerRegistry(serversDir);
}
