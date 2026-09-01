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
/**
 * Simple in-memory session storage
 * Used for testing and development; data is lost on restart
 */
export declare class InMemoryStorage implements SessionStorage {
    private sessions;
    save(session: McpSession): Promise<string>;
    load(id: string): Promise<McpSession>;
    list(filter?: {
        tags?: string[];
        serverName?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<McpSession[]>;
    delete(id: string): Promise<void>;
    update(id: string, updates: Partial<McpSession>): Promise<void>;
    export(id: string, format: "json" | "jsonl"): Promise<string>;
}
/**
 * Store sessions as JSON files in the local filesystem
 *
 * Default location: ~/.mcp-studio/sessions/
 */
export declare class LocalJsonStorage implements SessionStorage {
    constructor(baseDir?: string);
    save(session: McpSession): Promise<string>;
    load(id: string): Promise<McpSession>;
    list(filter?: {
        tags?: string[];
        serverName?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<McpSession[]>;
    delete(id: string): Promise<void>;
    update(id: string, updates: Partial<McpSession>): Promise<void>;
    export(id: string, format: "json" | "jsonl"): Promise<string>;
}
/**
 * Store sessions in a local SQLite database
 *
 * Default location: ~/.mcp-studio/sessions.db
 */
export declare class LocalSqliteStorage implements SessionStorage {
    constructor(dbPath?: string);
    save(session: McpSession): Promise<string>;
    load(id: string): Promise<McpSession>;
    list(filter?: {
        tags?: string[];
        serverName?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<McpSession[]>;
    delete(id: string): Promise<void>;
    update(id: string, updates: Partial<McpSession>): Promise<void>;
    export(id: string, format: "json" | "jsonl"): Promise<string>;
}
export declare function createMemoryStorage(): SessionStorage;
//# sourceMappingURL=index.d.ts.map