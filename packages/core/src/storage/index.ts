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
// Local Implementations
// ============================================================================

/**
 * Store sessions as JSON files in the local filesystem
 *
 * Default location: ~/.mcp-studio/sessions/
 */
export class LocalJsonStorage implements SessionStorage {
  constructor(baseDir: string = "~/.mcp-studio/sessions") {
    // TODO: Implement
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
    // TODO: Implement
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
