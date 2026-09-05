/**
 * MCP Server Registry
 *
 * Manages the collection of community-submitted MCP server listings.
 * Listings are JSON files in servers/ directory.
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

/**
 * Registry class - loads and queries server listings
 */
export class ServerRegistry {
  private listings: Map<string, ServerListing> = new Map();
  private serversDir?: string;

  constructor(serversDir?: string) {
    this.serversDir = serversDir;
  }

  /**
   * Load listings from the registry directory
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
