/**
 * Session Storage Implementation
 *
 * Concrete implementations of SessionStorage:
 * - InMemoryStorage (testing & transient dev)
 * - LocalJsonStorage (persistent ~/.mcp-studio/sessions/)
 */

import { promises as fs } from "fs";
import * as path from "path";
import * as os from "os";
import { McpSession, parseSession } from "../schemas/index.js";

export interface SessionStorage {
  /**
   * Save a session to storage
   * @returns session.id
   */
  save(session: McpSession): Promise<string>;

  /**
   * Load a session by ID
   */
  load(id: string): Promise<McpSession>;

  /**
   * List sessions with optional filtering
   */
  list(filter?: {
    tags?: string[];
    serverName?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<McpSession[]>;

  /**
   * Delete a session by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Update a session (metadata, tags, notes)
   */
  update(id: string, updates: Partial<McpSession>): Promise<void>;

  /**
   * Export a session as JSON or JSONL
   */
  export(id: string, format: "json" | "jsonl"): Promise<string>;
}

// ============================================================================
// In-Memory Implementation
// ============================================================================

export class InMemoryStorage implements SessionStorage {
  private sessions: Map<string, McpSession> = new Map();

  async save(session: McpSession): Promise<string> {
    this.sessions.set(session.id, session);
    return session.id;
  }

  async load(id: string): Promise<McpSession> {
    const session = this.sessions.get(id);
    if (!session) {
      throw new Error(`Session not found: ${id}`);
    }
    return session;
  }

  async list(filter?: {
    tags?: string[];
    serverName?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<McpSession[]> {
    let results = Array.from(this.sessions.values());

    if (filter?.serverName) {
      results = results.filter((s) => s.serverInfo.name === filter.serverName);
    }

    if (filter?.tags && filter.tags.length > 0) {
      results = results.filter(
        (s) => s.metadata?.tags && filter.tags?.some((tag) => s.metadata?.tags?.includes(tag))
      );
    }

    if (filter?.startDate) {
      results = results.filter((s) => new Date(s.startedAt) >= filter.startDate!);
    }

    if (filter?.endDate) {
      results = results.filter((s) => !s.endedAt || new Date(s.endedAt) <= filter.endDate!);
    }

    return results;
  }

  async delete(id: string): Promise<void> {
    this.sessions.delete(id);
  }

  async update(id: string, updates: Partial<McpSession>): Promise<void> {
    const session = this.sessions.get(id);
    if (!session) {
      throw new Error(`Session not found: ${id}`);
    }
    this.sessions.set(id, { ...session, ...updates });
  }

  async export(id: string, format: "json" | "jsonl"): Promise<string> {
    const session = await this.load(id);
    if (format === "json") {
      return JSON.stringify(session, null, 2);
    } else if (format === "jsonl") {
      return session.events.map((event) => JSON.stringify(event)).join("\n");
    }
    throw new Error(`Unsupported export format: ${format}`);
  }
}

// ============================================================================
// Local JSON Filesystem Implementation
// ============================================================================

export class LocalJsonStorage implements SessionStorage {
  private baseDir: string;
  private initialized: boolean = false;

  constructor(baseDir?: string) {
    if (baseDir) {
      this.baseDir = baseDir.startsWith("~")
        ? path.join(os.homedir(), baseDir.slice(1))
        : path.resolve(baseDir);
    } else {
      this.baseDir = path.join(os.homedir(), ".mcp-studio", "sessions");
    }
  }

  private async ensureDir(): Promise<void> {
    if (!this.initialized) {
      await fs.mkdir(this.baseDir, { recursive: true });
      this.initialized = true;
    }
  }

  private getFilePath(id: string): string {
    return path.join(this.baseDir, `${id}.json`);
  }

  async save(session: McpSession): Promise<string> {
    await this.ensureDir();
    const filePath = this.getFilePath(session.id);
    const tempPath = `${filePath}.tmp.${Date.now()}`;
    const data = JSON.stringify(session, null, 2);

    await fs.writeFile(tempPath, data, "utf8");
    await fs.rename(tempPath, filePath);
    return session.id;
  }

  async load(id: string): Promise<McpSession> {
    await this.ensureDir();
    const filePath = this.getFilePath(id);
    try {
      const content = await fs.readFile(filePath, "utf8");
      return parseSession(JSON.parse(content));
    } catch (err: any) {
      if (err.code === "ENOENT") {
        throw new Error(`Session not found: ${id}`);
      }
      throw err;
    }
  }

  async list(filter?: {
    tags?: string[];
    serverName?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<McpSession[]> {
    await this.ensureDir();
    const files = await fs.readdir(this.baseDir);
    const sessions: McpSession[] = [];

    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      try {
        const filePath = path.join(this.baseDir, file);
        const content = await fs.readFile(filePath, "utf8");
        const session = parseSession(JSON.parse(content));

        let matches = true;
        if (filter?.serverName && session.serverInfo.name !== filter.serverName) {
          matches = false;
        }
        if (filter?.tags && filter.tags.length > 0) {
          const hasTag = session.metadata?.tags?.some((t) => filter.tags?.includes(t));
          if (!hasTag) matches = false;
        }
        if (filter?.startDate && new Date(session.startedAt) < filter.startDate) {
          matches = false;
        }
        if (filter?.endDate && session.endedAt && new Date(session.endedAt) > filter.endDate) {
          matches = false;
        }

        if (matches) {
          sessions.push(session);
        }
      } catch {
        // Ignore unparseable files
      }
    }

    return sessions.sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }

  async delete(id: string): Promise<void> {
    await this.ensureDir();
    const filePath = this.getFilePath(id);
    try {
      await fs.unlink(filePath);
    } catch (err: any) {
      if (err.code !== "ENOENT") throw err;
    }
  }

  async update(id: string, updates: Partial<McpSession>): Promise<void> {
    const session = await this.load(id);
    const updated = {
      ...session,
      ...updates,
      metadata: {
        ...session.metadata,
        ...updates.metadata,
      },
    };
    await this.save(updated);
  }

  async export(id: string, format: "json" | "jsonl"): Promise<string> {
    const session = await this.load(id);
    if (format === "json") {
      return JSON.stringify(session, null, 2);
    } else if (format === "jsonl") {
      return session.events.map((event) => JSON.stringify(event)).join("\n");
    }
    throw new Error(`Unsupported export format: ${format}`);
  }
}

export class LocalSqliteStorage extends LocalJsonStorage {
  // SQLite compatibility adapter fallback to LocalJsonStorage
  constructor(dbPath?: string) {
    super(dbPath ? path.dirname(dbPath) : undefined);
  }
}

// ============================================================================
// Exports
// ============================================================================

export function createMemoryStorage(): SessionStorage {
  return new InMemoryStorage();
}

export function createJsonStorage(baseDir?: string): SessionStorage {
  return new LocalJsonStorage(baseDir);
}
