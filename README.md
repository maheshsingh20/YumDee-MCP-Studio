# MCP Studio

> Open-source, all-in-one TypeScript toolkit for the Model Context Protocol (MCP) ecosystem.

**MCP Studio** is a suite of tools that makes building, testing, inspecting, and orchestrating Model Context Protocol (MCP) servers reliable, discoverable, and auditable.

---

## 🚀 Features

### 🔍 Inspector
Visual debugger and monitoring console for MCP servers with live event streams and deterministic session replay.

- **Warm Minimalist Design System**: Built with an editorial serif + geometric sans pairing (**Fraunces** & **Plus Jakarta Sans**), flat 0.5px tinted borders, 5px radius, and a complete light/dark mode color swap.
- **Direct Server Connection**: Connect to local stdio servers (`node server.js`, `python server.py`, `npx ...`) or remote HTTP servers with smart relative path resolution.
- **Interactive Tool Execution**: Auto-generated schema-based forms for invoking tools with parameter type validation and formatted JSON response inspection.
- **Live Event Stream**: Real-time Server-Sent Events (SSE) tracking requests, responses, tool calls, and latencies.
- **Session Recording & Replay**: Record execution traces to standardized `McpSession` files and visually replay them step-by-step with diff comparisons.
- **One-Click Presets**: Instant connection buttons for bundled example servers (e.g., Math Server).

### ⚡ Bench
Compliance scoring, performance profiling, and reliability benchmarking for MCP servers.

- **4-Part Compliance Scoring**: Handshake adherence, introspection integrity, tool execution format, and error handling.
- **Latency Percentiles**: Measures P50 and P95 latency distributions across repeated tool calls.
- **Regression Detection**: Replays prior recorded sessions against live servers and detects output mismatches.
- **CI/CD Gating**: Command-line gating with `--min-score` to prevent breaking deployments (e.g. `--min-score 80`).

### 📦 Registry
Community-driven directory of MCP servers with zero-configuration client installation.

- **Server Discovery**: Search listings by keyword, category, or tag (`mcp-studio search <keyword>`).
- **One-Command Installation**: Add verified servers (`mcp-studio add <server-name>`) with automatic configuration for:
  - **Claude Desktop** (`claude_desktop_config.json`)
  - **Cursor** (`cursor_settings.json`)
  - Automatic `.bak` configuration backups before any modification.
- **Listing Validation**: Lints and verifies server metadata schemas against strict registry standards.

### 🤖 Agent-kit
Multi-server orchestration framework that binds multiple MCP servers into an intelligent agent workflow.

- **Multi-Server Aggregation**: Merge tools, prompts, and resources from 2+ independent MCP servers into a single interface.
- **ReAct Execution Loop**: Built-in reasoning and acting loop with cycle detection and max-step safety guards.
- **Pluggable LLM Adapters**: Native support for **Claude**, **OpenAI**, **Ollama**, and deterministic **Mock** models.
- **Audit-Ready Sessions**: Exports agent executions as standard `McpSession` files ready for benchmarking and inspection.

### 🗄️ Core
The foundational engine powering all MCP Studio tools.

- **Universal Session Schema**: Strict Zod schemas defining sessions, tools, events, and metrics.
- **Robust MCP Clients**: `StdioMcpClient` (subprocess spawning with JSON-RPC 2.0 framing) and `HttpMcpClient` (fetch/SSE).
- **Session Storage**: Atomic JSON file storage with thread-safe writes, session querying, and JSON / JSONL export capabilities.

---

## 📦 Packages

| Package | Version | Purpose | Status |
| :--- | :--- | :--- | :--- |
| [`@yumdee/mcp-studio-core`](./packages/core) | `0.1.0` | Session schemas, stdio/HTTP clients, atomic storage | ✅ Implemented & Tested |
| [`@yumdee/mcp-studio-inspector`](./packages/inspector) | `0.1.0` | Fastify server, REST/SSE API, React UI console | ✅ Implemented & Tested |
| [`@yumdee/mcp-studio-registry`](./packages/registry) | `0.1.0` | Community directory, validation, Claude & Cursor CLI | ✅ Implemented & Tested |
| [`@yumdee/mcp-studio-agent-kit`](./packages/agent-kit) | `0.1.0` | Multi-server aggregation, ReAct loop, model adapters | ✅ Implemented & Tested |
| [`@yumdee/mcp-studio-bench`](./packages/bench) | `0.1.0` | Compliance grading, P50/P95 latencies, replay diff | ✅ Implemented & Tested |

---

## 🛠️ Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MCP Studio Monorepo                             │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                    @yumdee/mcp-studio-core                     │   │
│   │   • McpSession Schema (Zod)                                    │   │
│   │   • StdioMcpClient & HttpMcpClient (JSON-RPC 2.0)              │   │
│   │   • LocalJsonStorage (Atomic Writes, JSON/JSONL Export)        │   │
│   └────────────────────────────────────────────────────────────────┘   │
│                 ▲                  ▲                  ▲                │
│                 │                  │                  │                │
│        ┌────────┴────────┐  ┌──────┴──────┐  ┌────────┴────────┐       │
│        │    Inspector    │  │   Registry  │  │    Agent-kit    │       │
│        │ (Fastify + UI)  │  │    (CLI)    │  │ (ReAct & LLMs)  │       │
│        └────────┬────────┘  └─────────────┘  └────────┬────────┘       │
│                 │                                     │                │
│                 └──────────────────┬──────────────────┘                │
│                                    ▼                                   │
│                            ┌───────────────┐                           │
│                            │     Bench     │                           │
│                            │ (Compliance & │                           │
│                            │  Regression)  │                           │
│                            └───────────────┘                           │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🚦 Quick Start

### 1. Prerequisites & Installation

Ensure you have **Node.js ≥ 18.0.0** and **pnpm ≥ 8.0.0** installed:

```bash
# Clone the repository
git clone https://github.com/maheshsingh20/YumDee-MCP-Studio.git
cd YumDee-MCP-Studio

# Install all workspace dependencies
pnpm install

# Build all packages
pnpm build

# Run comprehensive test suites
pnpm test
```

### 2. Launching the Inspector UI

Start the visual debugger with the warm minimalist design system:

```bash
# Start Inspector on port 3000
node packages/inspector/dist/cli.js --port 3000

# Or via package filter
pnpm --filter @yumdee/mcp-studio-inspector start
```

Open your browser at **`http://localhost:3000`**. You can:
- Switch between **Light** and **Dark** mode using the top-right toggle.
- Click **"Math Server"** in the Quick Presets to immediately launch and connect to the bundled calculator server.
- Interactively test `calculate` tool executions and review live latencies and JSON-RPC event payloads.

### 3. Running Compliance Benchmarks

Test any recorded session or MCP server for spec compliance and regression:

```bash
# Run benchmark CLI against a recorded session
node packages/bench/dist/cli.js --session ./path/to/session.json --min-score 80
```

Programmatic benchmark usage:
```typescript
import { McpBenchmark } from "@yumdee/mcp-studio-bench";

const bench = new McpBenchmark({
  runsPerTool: 5,
  minComplianceScore: 80,
  detectRegressions: true,
});

const report = await bench.run(client, baselineSession);
console.log(`Overall Score: ${report.overallScore}/100`);
console.log(`P95 Latency: ${report.latencyPercentiles.p95}ms`);
```

### 4. Searching & Installing Servers with Registry CLI

```bash
# List all verified community MCP servers
node packages/registry/dist/cli.js list

# Search for servers by keyword
node packages/registry/dist/cli.js search postgres

# Install a server into Claude Desktop or Cursor
node packages/registry/dist/cli.js add postgres-mcp --target claude
```

### 5. Multi-Server Agent Orchestration with Agent-kit

```typescript
import { createAgent } from "@yumdee/mcp-studio-agent-kit";
import { StdioMcpClient } from "@yumdee/mcp-studio-core";

const mathClient = new StdioMcpClient({
  command: "node",
  args: ["./examples/math-server/dist/index.js"],
});

const agent = createAgent({
  clients: [mathClient],
  model: "claude", // or "openai", "ollama", "mock"
  maxSteps: 5,
});

await agent.initialize();

const result = await agent.run("What is 45 multiplied by 12, then add 100?");
console.log(result.finalAnswer);

// Export full session for auditing or benching
const session = agent.exportSession();
```

---

## 🎨 Inspector Design System

The Inspector UI is crafted with a bespoke **Warm Minimalist** design system:
- **Typography**: Editorial serif [Fraunces](https://fonts.google.com/specimen/Fraunces) for logos, headings, and card titles; [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) for clear body text and mono code displays.
- **Color Palettes**:
  - **Light Mode**: Sand background (`#F9F6F0`), Ivory cards (`#FFFFFF` / `#F3EFE6`), Warm charcoal text (`#1C1917`), Terracotta accents (`#C2593F`), Olive badges (`#526E48`).
  - **Dark Mode**: Deep espresso background (`#141210`), Dark roast cards (`#1C1916` / `#231F1B`), Cream text (`#F5EFEB`), Muted terracotta accents (`#D47257`), Sage badges (`#7C9A70`).
- **Flat Geometry**: 0.5px tinted borders, 5px rounded corners, with zero gradients, glow effects, or drop shadows.

---

## 🧪 Testing

The repository includes comprehensive unit and integration test suites:

```bash
# Run all vitest suites across the monorepo
pnpm test

# Run type checks across all workspaces
pnpm type-check

# Run linter
pnpm lint
```

---

## 🤝 Contributing

Contributions are welcome! Please check out [CONTRIBUTING.md](CONTRIBUTING.md) for details on code style, branch naming conventions, and the pull request submission process.

---

## 📄 License

MIT License. See [LICENSE](LICENSE) for full details.
