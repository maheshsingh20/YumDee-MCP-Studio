/**
 * Session Storage Interface
 *
 * Abstract interface for storing and retrieving MCP sessions.
 * Implementations can be local JSON, SQLite, or hosted later.
 */
// ============================================================================
// In-Memory Implementation (for testing/development)
// ============================================================================
/**
 * Simple in-memory session storage
 * Used for testing and development; data is lost on restart
 */
export class InMemoryStorage {
    constructor() {
        this.sessions = new Map();
    }
    async save(session) {
        this.sessions.set(session.id, session);
        return session.id;
    }
    async load(id) {
        const session = this.sessions.get(id);
        if (!session) {
            throw new Error(`Session not found: ${id}`);
        }
        return session;
    }
    async list(filter) {
        let results = Array.from(this.sessions.values());
        if (filter?.serverName) {
            results = results.filter((s) => s.serverInfo.name === filter.serverName);
        }
        if (filter?.tags && filter.tags.length > 0) {
            results = results.filter((s) => s.metadata?.tags &&
                filter.tags?.some((tag) => s.metadata?.tags?.includes(tag)));
        }
        if (filter?.startDate) {
            results = results.filter((s) => new Date(s.startedAt) >= filter.startDate);
        }
        if (filter?.endDate) {
            results = results.filter((s) => !s.endedAt ||
                new Date(s.endedAt) <= filter.endDate);
        }
        return results;
    }
    async delete(id) {
        this.sessions.delete(id);
    }
    async update(id, updates) {
        const session = this.sessions.get(id);
        if (!session) {
            throw new Error(`Session not found: ${id}`);
        }
        this.sessions.set(id, { ...session, ...updates });
    }
    async export(id, format) {
        const session = await this.load(id);
        if (format === "json") {
            return JSON.stringify(session, null, 2);
        }
        else if (format === "jsonl") {
            return session.events
                .map((event) => JSON.stringify(event))
                .join("\n");
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
export class LocalJsonStorage {
    constructor(baseDir = "~/.mcp-studio/sessions") {
        // TODO: Implement with fs module
        // - Create baseDir if not exists
        // - Expand ~ to home directory
    }
    async save(session) {
        throw new Error("Not yet implemented");
    }
    async load(id) {
        throw new Error("Not yet implemented");
    }
    async list(filter) {
        throw new Error("Not yet implemented");
    }
    async delete(id) {
        throw new Error("Not yet implemented");
    }
    async update(id, updates) {
        throw new Error("Not yet implemented");
    }
    async export(id, format) {
        throw new Error("Not yet implemented");
    }
}
/**
 * Store sessions in a local SQLite database
 *
 * Default location: ~/.mcp-studio/sessions.db
 */
export class LocalSqliteStorage {
    constructor(dbPath = "~/.mcp-studio/sessions.db") {
        // TODO: Implement with better-sqlite3 or sql.js
    }
    async save(session) {
        throw new Error("Not yet implemented");
    }
    async load(id) {
        throw new Error("Not yet implemented");
    }
    async list(filter) {
        throw new Error("Not yet implemented");
    }
    async delete(id) {
        throw new Error("Not yet implemented");
    }
    async update(id, updates) {
        throw new Error("Not yet implemented");
    }
    async export(id, format) {
        throw new Error("Not yet implemented");
    }
}
// ============================================================================
// Exports
// ============================================================================
export function createMemoryStorage() {
    return new InMemoryStorage();
}
//# sourceMappingURL=index.js.map