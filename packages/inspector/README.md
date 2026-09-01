# @yumdee/mcp-studio-inspector

Web UI debugger + session replay tool for MCP servers.

## Features

- Connect to any MCP server (stdio, SSE, HTTP)
- Live introspection: view tools, resources, prompts with schemas
- Manual tool invocation with auto-generated forms
- Session recording + replay (catch regressions)
- Multi-server session debugging (agent workflows)
- Export sessions as shareable `.mcpsession.json` files

## Usage

```bash
pnpm install @yumdee/mcp-studio-inspector
mcp-studio-inspect <server-name>
```

## Development

See [../../CONTRIBUTING.md](../../CONTRIBUTING.md)
