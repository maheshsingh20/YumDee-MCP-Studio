# Session Format

The core data structure for yumdee-Mcp-studio is the `McpSession`, which records every interaction with an MCP server.

## McpSession

```typescript
interface McpSession {
  id: string;                    // UUID
  serverInfo: ServerInfo;        // Server details
  clientInfo: {
    name: "yumdee-mcp-studio";
    version: string;
  };
  startedAt: string;             // ISO 8601 datetime
  endedAt?: string;              // ISO 8601 datetime
  events: McpEvent[];            // Array of events (see below)
  metadata?: {
    tags?: string[];             // e.g., ["regression-test", "user-defined"]
    notes?: string;              // User notes
  };
}
```

## McpEvent

An event is one of: request, response, notification, or error.

### Request Event

```typescript
{
  type: "request";
  timestamp: string;             // ISO 8601 datetime
  id: number;                    // JSON-RPC request ID
  method: string;                // e.g., "tools/list", "resources/read"
  params?: unknown;              // Method parameters
  sentAtMs: number;              // Milliseconds since session start
}
```

### Response Event

```typescript
{
  type: "response";
  timestamp: string;
  id: number;                    // Matches request ID
  result?: unknown;              // Response data
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
  receivedAtMs: number;          // Milliseconds since session start
  latencyMs: number;             // Response - Request timestamp
}
```

### Notification Event

```typescript
{
  type: "notification";
  timestamp: string;
  method: string;                // e.g., "notifications/progress"
  params?: unknown;
  sentAtMs: number;
  direction: "client->server" | "server->client";
}
```

### Error Event

```typescript
{
  type: "error";
  timestamp: string;
  code: string;                  // e.g., "TRANSPORT_FAILED", "PARSE_ERROR"
  message: string;
  payload?: unknown;             // Optional error details
}
```

## Why This Format?

1. **Deterministic replay** — Every request/response is logged with latency, so replay can check outputs
2. **Debugging** — Inspector can visualize the full message exchange
3. **Compliance scoring** — Bench can validate response formats, latencies, error handling
4. **Multi-transport** — Works the same whether stdio, SSE, or HTTP
5. **Agent logging** — Agent-kit can record all steps without duplicating session logic

## Storage

By default, sessions are stored as JSON files:
```
~/.mcp-studio/sessions/
  ├── 550e8400-e29b-41d4-a716-446655440000.json
  ├── 550e8400-e29b-41d4-a716-446655440001.json
  └── ...
```

Can upgrade to SQLite or hosted backend without changing the format.
