# Example MCP Servers

This folder contains example MCP server implementations for learning and testing purposes.

## Available Examples

### math-server

A simple calculator server exposing basic math operations.

```bash
node examples/math-server/dist/index.js
```

**Exposed Tools:**

- `add(a, b)` — Add two numbers
- `subtract(a, b)` — Subtract two numbers
- `multiply(a, b)` — Multiply two numbers
- `divide(a, b)` — Divide two numbers

### weather-server

A mock weather API server for testing multi-tool interactions.

```bash
node examples/weather-server/dist/index.js
```

**Exposed Tools:**

- `get_weather(city)` — Get current weather
- `get_forecast(city, days)` — Get weather forecast

## Building Examples

```bash
# Build all examples
pnpm run build

# Build a specific example
pnpm run build --filter @yumdee/mcp-studio-examples-math
```

## Using with Inspector

```bash
# Terminal 1: Start example server
node examples/math-server/dist/index.js

# Terminal 2: Start inspector
pnpm --filter @yumdee/mcp-studio-inspector dev

# Open http://localhost:3000 and connect to the server
```

## Creating Your Own

Use these examples as templates to build your own MCP servers. Key steps:

1. Implement the `McpServer` interface (from `@yumdee/mcp-studio-core`)
2. Define your tools as JSON schemas
3. Handle incoming tool calls and return results
4. Publish your server to npm for inclusion in the registry
