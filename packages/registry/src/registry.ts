/**
 * MCP Server Registry
 *
 * Manages the collection of community-submitted MCP server listings.
 * Listings are JSON files in servers/ directory.
 *
 * Schema: Each server listing must have:
 * - name: unique server identifier
 * - displayName: human-readable name
 * - description: what the server does
 * - homepage: link to documentation
 * - repository: GitHub or other repo link
 * - transport: "stdio" | "sse" | "http"
 * - command: (for stdio) executable command
 * - endpoint: (for sse/http) URL
 * - author: name/email of maintainer
 * - license: SPDX license identifier
 */

import { z } from "zod";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

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

  /**
   * Load listings from the registry
   * (In v1, these are static JSON files; later could be from an API)
   */
  async load(): Promise<void> {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const serversDir = path.resolve(__dirname, "../servers");

    try {
      const files = await fs.readdir(serversDir);
      for (const file of files) {
        if (!file.endsWith(".json")) continue;
        const filePath = path.join(serversDir, file);
        try {
          const content = await fs.readFile(filePath, "utf-8");
          const parsed = JSON.parse(content);
          const listing = ServerListingSchema.parse(parsed);
          this.listings.set(listing.name, listing);
        } catch (err) {
          console.warn(`[Registry] Failed to load server listing from ${file}:`, err);
        }
      }
    } catch (err) {
      console.warn(`[Registry] Could not read servers directory:`, err);
    }
  }

  /**
   * Get a server listing by name
   */
  get(name: string): ServerListing | undefined {
    return this.listings.get(name);
  }

  /**
   * Search for servers by keyword (name, description, tags)
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
    return Array.from(this.listings.values()).filter((listing) => listing.tags?.includes(tag));
  }
}

export function createRegistry(): ServerRegistry {
  return new ServerRegistry();
}
