# MCP Studio

> Open-source, all-in-one TypeScript toolkit for the Model Context Protocol (MCP) ecosystem with Semantic Tool Routing and AI Root-Cause Diagnostics.

**MCP Studio** is a full-featured developer platform that makes building, testing, inspecting, and orchestrating Model Context Protocol (MCP) servers reliable, discoverable, and auditable.

---

## 🚀 Features

### 🔍 Inspector with AI Diagnostic Copilot
Visual debugger and monitoring console for MCP servers with live event streams, deterministic session replay, and an inline AI Diagnostic Copilot.

- **✨ AI Root-Cause Diagnostic & Auto-Fix**: Automatically diagnoses failed JSON-RPC tool executions, identifies missing required parameters, type mismatches, and boundary conditions (e.g. division by zero), and synthesizes one-click argument patches directly in the UI.
- **Warm Minimalist Design System**: Built with an editorial serif + geometric sans pairing (**Fraunces** & **Plus Jakarta Sans**), flat 0.5px tinted borders, 5px radius, and a complete light/dark mode color swap.
- **Direct Server Connection**: Connect to local stdio servers (`node server.js`, `python server.py`, `npx ...`) or remote HTTP servers with smart relative path resolution.
- **Interactive Tool Execution**: Auto-generated schema-based forms for invoking tools with parameter type validation and formatted JSON response inspection.
- **Live Event Stream**: Real-time Server-Sent Events (SSE) tracking requests, responses, tool calls, and latencies.
- **Session Recording & Replay**: Record execution traces to standardized `McpSession` files and visually replay them step-by-step with diff comparisons.
- **One-Click Presets**: Instant connection buttons for bundled example servers (e.g., Math Server).

### 🤖 Agent-kit with Dynamic Semantic Tool Router
Multi-server orchestration framework that binds multiple MCP servers into an intelligent agent workflow with vector-based tool retrieval.

- **🧠 Dynamic Semantic Tool Router**: Employs vector embeddings and cosine similarity to dynamically select the top-K relevant tools for each turn. Prunes inactive tool definitions to cut prompt token usage by **70–90%** and prevent LLM tool hallucinations.
- **Dual Vectorizer Architecture**: Includes a high-speed, zero-dependency subword n-gram / TF-IDF sparse vectorizer out of the box, with support for dense embedding providers (OpenAI `text-embedding-3-small`, Ollama `nomic-embed-text`).
- **Multi-Server Aggregation**: Merge tools, prompts, and resources from 2+ independent MCP servers into a single interface.
- **ReAct Execution Loop**: Built-in reasoning and acting loop with cycle detection and max-step safety guards.
- **Pluggable LLM Adapters**: Native support for **Claude**, **OpenAI**, **Ollama**, and deterministic **Mock** models.
- **Audit-Ready Sessions**: Exports agent executions as standard `McpSession` files with token reduction metrics.

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

### 🗄️ Core
The foundational engine powering all MCP Studio tools.

- **Universal Session Schema**: Strict Zod schemas defining sessions, tools, events, and metrics with metadata passthrough.
- **Robust MCP Clients**: `StdioMcpClient` (subprocess spawning with JSON-RPC 2.0 framing) and `HttpMcpClient` (fetch/SSE).
- **Session Storage**: Atomic JSON file storage with thread-safe writes, session querying, and JSON / JSONL export capabilities.

---

## 📦 Packages

| Package | Version | Purpose | Status |
| :--- | :--- | :--- | :--- |
| [`@yumdee/mcp-studio-core`](./packages/core) | `0.1.0` | Session schemas, stdio/HTTP clients, atomic storage | ✅ Implemented & Tested |
| [`@yumdee/mcp-studio-inspector`](./packages/inspector) | `0.1.0` | Fastify server, AI Diagnostic Copilot, React UI console | ✅ Implemented & Tested |
| [`@yumdee/mcp-studio-registry`](./packages/registry) | `0.1.0` | Community directory, validation, Claude & Cursor CLI | ✅ Implemented & Tested |
| [`@yumdee/mcp-studio-agent-kit`](./packages/agent-kit) | `0.1.0` | Semantic Tool Router, ReAct loop, model adapters | ✅ Implemented & Tested |
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
│        │  (Fastify + UI  │  │    (CLI)    │  │ (ReAct & LLMs)  │       │
│        │  + AI Copilot)  │  │             │  │+ Semantic Router│       │
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

## ⚡ Instant Quickstart (Zero Install via NPX)

You can launch and run the Inspector debugger directly in any terminal with zero setup:

```bash
npx @yumdee/mcp-studio-inspector
```

Or run on a specific port:

```bash
npx @yumdee/mcp-studio-inspector --port 4000
```

Open **`http://localhost:3000`** in your browser to inspect servers, test tools, and run the AI Copilot.

---

## 🚦 Local Development & Contribution

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

# Run comprehensive test suites across the monorepo
pnpm test
```

### 2. Launching the Inspector UI with AI Copilot

Start the visual debugger with the warm minimalist design system:

```bash
# Start Inspector on port 3000
node packages/inspector/dist/cli.js --port 3000

# Or via package filter
pnpm --filter @yumdee/mcp-studio-inspector start
```

Open your browser at **`http://localhost:3000`**:
- Switch between **Light** and **Dark** mode using the top-right toggle.
- Connect to the bundled Math Server via Quick Presets.
- Intentionally send an invalid parameter or attempt division by zero.
- Click **"✨ Diagnose with AI Copilot"** to view root-cause analysis and click **"✨ Apply to Runner"** to auto-patch arguments!

### 3. Using the Dynamic Semantic Tool Router

```typescript
import { createAgent, SemanticToolRouter } from "@yumdee/mcp-studio-agent-kit";
import { StdioMcpClient } from "@yumdee/mcp-studio-core";

// 1. Standalone Router Usage
const router = new SemanticToolRouter({ topK: 2, minScore: 0.1 });
await router.indexTools(allServerTools);

const { selectedTools, metrics } = await router.route("What is 50 divided by 5?");
console.log(`Selected: ${selectedTools.map(t => t.name).join(", ")}`);
console.log(`Tokens saved: ${metrics.tokensSaved} (${metrics.reductionPercentage}% reduction)`);

// 2. Orchestrated Agent with Semantic Routing
const agent = createAgent({
  servers: [mathClient, filesystemClient, dbClient],
  model: "claude", // or "openai", "ollama", "mock"
  useSemanticRouting: true,
  semanticRouterConfig: { topK: 3 },
});

const answer = await agent.run("Calculate total sales tax for order #1042");
console.log(answer);
```

### 4. Running Compliance Benchmarks

```bash
# Run benchmark CLI against a recorded session
node packages/bench/dist/cli.js --session ./path/to/session.json --min-score 80
```

### 5. Searching & Installing Servers with Registry CLI

```bash
# List all verified community MCP servers
node packages/registry/dist/cli.js list

# Search for servers by keyword
node packages/registry/dist/cli.js search postgres

# Install a server into Claude Desktop or Cursor
node packages/registry/dist/cli.js add postgres-mcp --target claude
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
# Run all vitest suites across the monorepo (12/12 passing)
pnpm test

# Run type checks across all workspaces (0 errors)
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
