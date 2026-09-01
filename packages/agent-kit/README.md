# @yumdee/mcp-studio-agent-kit

Compose 2+ installed MCP servers into a single agent with a unified tool list.

## Features

- Compose multiple MCP servers into one agent
- Unified tool list (de-duped, namespaced)
- Adapters for Anthropic, OpenAI, Ollama
- Basic agentic loop (plan → call tool → observe → repeat)
- Auto-record all steps to core's session format

## Usage

```typescript
import { ComposedAgent } from "@yumdee/mcp-studio-agent-kit";
import { createStdioClient } from "@yumdee/mcp-studio-core";

const postgres = createStdioClient("npx postgres-mcp");
const filesystem = createStdioClient("npx filesystem-mcp");

const agent = new ComposedAgent([postgres, filesystem], {
  model: "gpt-4",
  maxSteps: 10,
});

const result = await agent.run("Query my database and save results to file");
```

## Development

See [../../CONTRIBUTING.md](../../CONTRIBUTING.md)
