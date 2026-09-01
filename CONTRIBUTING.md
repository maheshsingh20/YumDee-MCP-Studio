# Contributing to yumdee-Mcp-studio

Thank you for your interest in contributing! This document outlines the process and guidelines for contributing.

## Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/yumdee-Mcp-studio.git
   cd yumdee-Mcp-studio
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Start development:**
   ```bash
   pnpm dev
   ```

## Project Structure

```
packages/
  ├── core/            # Shared types, MCP client, session format
  ├── inspector/       # Web UI debugger + replay
  ├── registry/        # Community server listings + CLI
  ├── agent-kit/       # Multi-server orchestration
  └── bench/           # Compliance scoring

apps/
  └── docs/            # Documentation site

examples/              # Sample MCP servers
```

## Contributing Types

### 1. Adding a Registry Entry

Submit a new MCP server listing:

1. Create `packages/registry/servers/your-server-name.json`:
   ```json
   {
     "$schema": "https://yumdee-mcp-studio.dev/schema/server-listing.json",
     "name": "your-server-name",
     "displayName": "Your Server",
     "description": "Brief description",
     "transport": "stdio",
     "command": "npx your-server-name",
     "tags": ["category"]
   }
   ```

2. Submit a PR — CI will validate the schema and ping the server once.

### 2. Bug Reports & Feature Requests

Use GitHub Issues with clear titles and reproduction steps.

### 3. Code Contributions

- Follow the TypeScript code style (see `.eslintrc`)
- Add tests for new features
- Run `pnpm lint` and `pnpm type-check` before submitting
- Keep PRs focused and small when possible

## Commit Guidelines

Use conventional commits:

```
feat: add replay mode to inspector
fix: correct session timestamp calculation
docs: update API reference
test: add bench scoring tests
```

## Code of Conduct

Be respectful and inclusive. All contributors must follow our Code of Conduct.

## Questions?

Open a discussion or issue on GitHub. We're here to help!
