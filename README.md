# MCP Studio

> Open-source, all-in-one TypeScript toolkit for the MCP ecosystem

**MCP Studio** is a suite of tools that makes working with Model Context Protocol (MCP) servers easier, more reliable, and more discoverable.

## Features

### 🔍 Inspector

Visual debugger for MCP servers with live inspection and session replay.

- Connect to any local or remote MCP server
- View available tools, resources, and prompts
- Manually invoke tools with schema-based forms
- Record and replay sessions for regression testing
- Multi-server debugging for agent workflows

### 📦 Registry

Community-driven directory of MCP servers + easy installation.

- Discover verified MCP servers: `npx mcp-studio search <keyword>`
- One-command installation: `npx mcp-studio add <server>`
- Low-friction contributions: submit a JSON listing via PR
- Automatic server validation and verification

### 🤖 Agent-kit

Orchestrate multiple MCP servers into a single agent.

- Compose 2+ servers with a unified tool interface
- Support for Claude, GPT, and Ollama as reasoning models
- Automatic session recording for auditing
- Built on the shared session format (replay-able and bench-able)

### ⚡ Bench

Compliance scoring and reliability benchmarking.

- Spec compliance validation (handshake, error format, etc.)
- Latency percentile analysis (P50, P95)
- Tool success rate scoring
- Regression detection via session replay
- CI/CD integration (`--min-score 80` to gate deployments)

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/yumdee/mcp-studio.git
cd mcp-studio

# Install dependencies (requires pnpm ≥ 8.0.0)
pnpm install

# Start all services in development mode
pnpm dev
```

### Using the Inspector

```bash
# Terminal 1: Start inspector at localhost:3000
pnpm --filter @yumdee/mcp-studio-inspector dev

# Terminal 2: Start an example server
pnpm --filter @yumdee/mcp-studio-examples run start:math

# Open http://localhost:3000 and connect to the server
```

### Using the Registry CLI

```bash
# Search for servers
npx mcp-studio search postgres

# List all available servers
npx mcp-studio list

# Install a server (auto-configures Claude Desktop / Cursor)
npx mcp-studio add postgres-mcp
```

### Using Agent-kit

```typescript
import { createAgent } from "@yumdee/mcp-studio-agent-kit";
import { createStdioClient } from "@yumdee/mcp-studio-core";

const agent = createAgent({
  servers: [createStdioClient("npx postgres-mcp"), createStdioClient("npx filesystem-mcp")],
  model: "claude",
});

const result = await agent.run("Query the database and save results to a file");
const session = agent.getSession(); // Inspect/replay/bench this session
```

## Packages

| Package                        | Purpose                             | Status        |
| ------------------------------ | ----------------------------------- | ------------- |
| `@yumdee/mcp-studio-core`      | Session format, MCP client, storage | ✅ Scaffolded |
| `@yumdee/mcp-studio-inspector` | Web UI debugger + replay            | ✅ Scaffolded |
| `@yumdee/mcp-studio-registry`  | Server directory + CLI              | ✅ Scaffolded |
| `@yumdee/mcp-studio-agent-kit` | Multi-server orchestration          | ✅ Scaffolded |
| `@yumdee/mcp-studio-bench`     | Compliance scoring                  | ✅ Scaffolded |

## Architecture

```
┌─────────────────────────────────────────────────┐
│          MCP Studio Monorepo                    │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  @mcp-studio/core                       │   │
│  │  • McpSession schema (Zod)              │   │
│  │  • McpClient interface                  │   │
│  │  • SessionStorage interface             │   │
│  └─────────────────────────────────────────┘   │
│             ▲              ▲             ▲     │
│             │              │             │     │
│  ┌──────────┴───┐  ┌──────┴──────┐  ┌──┴────────┐
│  │  Inspector   │  │   Registry  │  │ Agent-kit │
│  │  (UI, API)   │  │   (CLI)     │  │ (Orch)    │
│  └──────────────┘  └─────────────┘  └───────────┘
│         │               │                │
│         └───────────────┼────────────────┘
│                         │
│                    ┌────▼────┐
│                    │  Bench   │
│                    │(Scoring) │
│                    └──────────┘
│
└─────────────────────────────────────────────────┘
```

**Key Design Decision:** The `McpSession` schema is the single source of truth. All packages (inspector, bench, agent-kit) read and write this format, enabling replay, deterministic scoring, and auditability.

## Development

### Building

```bash
pnpm build      # Build all packages
pnpm build:core # Build just core
```

### Testing

```bash
pnpm test       # Run all tests
pnpm test:core  # Run core tests
```

### Formatting & Linting

```bash
pnpm format             # Format all code
pnpm format:check       # Check formatting
pnpm lint               # Lint all packages
pnpm type-check         # Type-check all packages
```

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for:

- **Easy entry points** (good first issues)
- **Contribution guidelines** (code style, tests, docs)
- **Build order** (what to work on next)
- **Testing strategy** (unit, integration, manual)
- **Release process** (semantic versioning)

## Examples

See [examples/](./examples/) for sample MCP servers and usage patterns:

- `math-server` — Simple calculator (stdio-based)
- `weather-server` — Mock weather API (for testing multi-tool workflows)

## Documentation

- 📖 [Architecture](./apps/docs/ARCHITECTURE.md) — System design and data flow
- 📋 [Session Format](./apps/docs/SESSION_FORMAT.md) — McpSession schema spec
- 🔧 [CLI Guide](./apps/docs/CLI.md) — Registry CLI commands
- 🤝 [Contributing](./CONTRIBUTING.md) — How to contribute

## Why MCP Studio?

**Anthropic's official MCP Inspector** is great for single-server debugging, but it doesn't cover the full lifecycle:

| Feature                  | Official Inspector | MCP Studio |
| ------------------------ | ------------------ | ---------- |
| Single-server inspection | ✅                 | ✅         |
| Multi-server debugging   | ❌                 | ✅         |
| Session replay           | ❌                 | ✅         |
| Regression detection     | ❌                 | ✅         |
| Compliance scoring       | ❌                 | ✅         |
| Server registry          | ❌                 | ✅         |
| Agent orchestration      | ❌                 | ✅         |

**MCP Studio** fills the gaps with a cohesive, open-source toolkit.

## Community

- 💬 **Questions?** Open a [discussion](https://github.com/yumdee/mcp-studio/discussions)
- 🐛 **Found a bug?** [Open an issue](https://github.com/yumdee/mcp-studio/issues)
- 🤝 **Want to contribute?** See [CONTRIBUTING.md](CONTRIBUTING.md)

## License

MIT — See [LICENSE](LICENSE) for details.

---

**Made with ❤️ by the MCP community**
