# Architecture

## Overview

yumdee-Mcp-studio is a modular TypeScript toolkit for the MCP ecosystem. It consists of 5 independently publishable packages:

1. **Core** — Session recording format + MCP client abstraction
2. **Inspector** — Web UI debugger + replay tool
3. **Registry** — Community server directory + CLI
4. **Agent-kit** — Multi-server orchestration
5. **Bench** — Compliance scoring

## Design Principles

### Single Source of Truth for Sessions

Every interaction with an MCP server is recorded in a standardized `McpSession` format:

```typescript
interface McpSession {
  id: string;
  serverInfo: ServerInfo;
  events: McpEvent[]; // Every request, response, notification
  startedAt: string;
  endedAt?: string;
}
```

This means:
- **Inspector** records sessions as users interact
- **Replay** loads a session and re-runs it
- **Bench** scores a session deterministically (no network calls)
- **Agent-kit** automatically records all steps

### Decoupled Transport

The `McpClient` interface abstracts away transport details (stdio, SSE, HTTP). All three converge to the same interface, so packages don't need to know how the client connects.

### Lazy Storage

Storage starts as local JSON (zero setup), can upgrade to SQLite for better querying, or hosted backend later. The interface is already abstracted.

## Build Order

1. **Core** — Session format + client/storage interfaces
2. **Inspector** — Connect, list tools, manual invoke, record
3. **Replay** — Load session, re-run, diff (differentiator vs official inspector)
4. **Bench** — Compliance rubric + scoring
5. **Registry + CLI** — Once inspector has users
6. **Agent-kit** — Once all above are stable

## Package Dependencies

```
inspector ─┐
agent-kit ─┤
bench ─────┼──> core
registry ──┘     └─ zod
cli
```

No circular dependencies. Core depends only on `zod`.

## Key Differentiators

- **Replay + regression testing** (official inspector doesn't have this)
- **Multi-server session debugging** (for agent workflows)
- **Compliance benchmarking** (nobody else has this yet)
- **Deterministic bench scoring** (replayed sessions, no live calls)

## Session Format Contract

See [session.md](./session.md) for the complete `McpSession` and `McpEvent` schema.
