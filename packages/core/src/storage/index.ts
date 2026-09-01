/**
 * Session Storage Interface
 *
 * Abstract interface for storing and retrieving MCP sessions.
 * Implementations can be local JSON, SQLite, or hosted later.
 */

import { McpSession } from "../schemas/index.js";

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
// In-Memory Implementation (for testing/development)
// ============================================================================

/**
 * Simple in-memory session storage
 * Used for testing and development; data is lost on restart
 */
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
// Local Implementations
// ============================================================================

/**
 * Store sessions as JSON files in the local filesystem
 *
 * Default location: ~/.mcp-studio/sessions/
 */
export class LocalJsonStorage implements SessionStorage {
  constructor(baseDir: string = "~/.mcp-studio/sessions") {
    // TODO: Implement with fs module
    // - Create baseDir if not exists
    // - Expand ~ to home directory
  }

  async save(session: McpSession): Promise<string> {
    throw new Error("Not yet implemented");
  }

  async load(id: string): Promise<McpSession> {
    throw new Error("Not yet implemented");
  }

  async list(filter?: {
    tags?: string[];
    serverName?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<McpSession[]> {
    throw new Error("Not yet implemented");
  }

  async delete(id: string): Promise<void> {
    throw new Error("Not yet implemented");
  }

  async update(id: string, updates: Partial<McpSession>): Promise<void> {
    throw new Error("Not yet implemented");
  }

  async export(id: string, format: "json" | "jsonl"): Promise<string> {
    throw new Error("Not yet implemented");
  }
}

/**
 * Store sessions in a local SQLite database
 *
 * Default location: ~/.mcp-studio/sessions.db
 */
export class LocalSqliteStorage implements SessionStorage {
  constructor(dbPath: string = "~/.mcp-studio/sessions.db") {
    // TODO: Implement with better-sqlite3 or sql.js
  }

  async save(session: McpSession): Promise<string> {
    throw new Error("Not yet implemented");
  }

  async load(id: string): Promise<McpSession> {
    throw new Error("Not yet implemented");
  }

  async list(filter?: {
    tags?: string[];
    serverName?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<McpSession[]> {
    throw new Error("Not yet implemented");
  }

  async delete(id: string): Promise<void> {
    throw new Error("Not yet implemented");
  }

  async update(id: string, updates: Partial<McpSession>): Promise<void> {
    throw new Error("Not yet implemented");
  }

  async export(id: string, format: "json" | "jsonl"): Promise<string> {
    throw new Error("Not yet implemented");
  }
}

// ============================================================================
// Exports
// ============================================================================

export function createMemoryStorage(): SessionStorage {
  return new InMemoryStorage();
}
