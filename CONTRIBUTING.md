# Contributing to MCP Studio

Welcome! MCP Studio is an open-source project dedicated to making the Model Context Protocol ecosystem more accessible and reliable.

## Getting Started

### Prerequisites

- Node.js ≥ 18.0.0
- pnpm ≥ 8.0.0

### Local Development

```bash
git clone https://github.com/yumdee/mcp-studio.git
cd mcp-studio

# Install dependencies
pnpm install

# Start development mode (all packages)
pnpm dev

# Run tests
pnpm test

# Type-check all packages
pnpm type-check
```

## Project Structure

The repository is organized as a monorepo using pnpm workspaces and Turborepo:

```
packages/
  ├── core/       # Session format, MCP client interface, storage
  ├── inspector/  # Web UI debugger with live server inspection & replay
  ├── registry/   # Community server directory + CLI
  ├── agent-kit/  # Multi-server orchestration layer
  └── bench/      # Compliance scoring & regression detection

apps/
  └── docs/       # Documentation site
```

## What to Contribute

### Easy Entry Points (Good First Issues)

1. **Add a new MCP server to the registry**
   - Create a JSON listing in `packages/registry/servers/`
   - Run validation: `pnpm run validate-listings`
   - Open a PR with the new listing
   - **Time: 10 minutes**

2. **Improve documentation**
   - Edit files in `apps/docs/`
   - Add examples, clarify concepts, fix typos
   - **Time: 15-60 minutes**

3. **Add tests for existing functionality**
   - Each package has a `src/__tests__/` folder
   - Run: `pnpm test`
   - **Time: 30-90 minutes**

### Core Features

If you're ready for deeper contributions, here's the build order we follow:

1. **@mcp-studio/core** — Session format, MCP client, storage
   - Implement stdio/SSE/HTTP transport clients
   - Implement LocalJsonStorage and LocalSqliteStorage
   - Add more Zod validation schemas

2. **@mcp-studio/inspector** — Debugger + replay tool
   - Implement Express/Vite server
   - Build React UI components
   - Add WebSocket support for live updates
   - Implement session replay and diff

3. **@mcp-studio/bench** — Compliance scoring
   - Build scoring rubric engine
   - Implement regression detection
   - Add CI integration helpers

4. **@mcp-studio/agent-kit** — Multi-server orchestration
   - Add Anthropic Claude adapter
   - Add OpenAI GPT adapter
   - Add Ollama adapter

### Code Style & Standards

- **TypeScript**: All code must be strongly typed. Use `strict: true` in tsconfig.
- **Formatting**: Run `pnpm format` before committing.
- **Linting**: Run `pnpm lint` to check for errors.
- **Tests**: New features should include tests. Run `pnpm test`.
- **Exports**: All public APIs should be clearly documented with JSDoc comments.

### Session Format Stability

The `McpSession` schema (in `packages/core/src/schemas/index.ts`) is the contract between all packages. **Never break this interface** — it's what lets inspector, replay, and bench interoperate.

If you need to evolve the schema:

1. Propose the change in an issue first
2. Add a migration path for old sessions
3. Update documentation in `apps/docs/SESSION_FORMAT.md`

## Submitting Changes

### Before You Start

- Check [open issues](https://github.com/yumdee/mcp-studio/issues) to avoid duplicate work
- For large features, open an issue first to discuss design
- For registry listings, ensure your server is publicly available

### Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes
4. Run checks locally:
   ```bash
   pnpm format           # Fix formatting
   pnpm type-check       # Check types
   pnpm test             # Run tests
   pnpm lint             # Check linting
   ```
5. Commit with clear messages:
   ```bash
   git commit -m "feat: add session replay functionality"
   ```
6. Push to your fork and open a PR

### PR Guidelines

- Include a clear description of what changed and why
- Link related issues: `Closes #123`
- For registry PRs: include a link to the server's documentation
- Keep commits logical and squash if needed

### Code Review

All PRs require at least one approval. During review, we check:

- ✅ Follows project style and TypeScript conventions
- ✅ Tests pass and coverage is maintained
- ✅ Doesn't break existing APIs (especially `McpSession`)
- ✅ Documentation is clear and up-to-date
- ✅ Commit history is clean

## Testing Strategy

### Unit Tests

Each package has `vitest` configured for unit tests:

```bash
# Run tests in a specific package
cd packages/core
pnpm test

# Watch mode for development
pnpm test --watch
```

### Integration Tests

Inspector and Agent-kit require integration tests against real MCP servers. These can be run manually:

```bash
# Start an example server in one terminal
pnpm --filter @yumdee/mcp-studio-examples run dev

# In another terminal, run inspector tests
pnpm --filter @yumdee/mcp-studio-inspector test:integration
```

### Adding New Tests

```typescript
// Example: packages/core/src/__tests__/storage.test.ts
import { describe, it, expect } from "vitest";
import { InMemoryStorage } from "../storage";

describe("InMemoryStorage", () => {
  it("should save and load sessions", async () => {
    const storage = new InMemoryStorage();
    const session = { id: "test-123", ... };

    const id = await storage.save(session);
    expect(id).toBe("test-123");

    const loaded = await storage.load(id);
    expect(loaded).toEqual(session);
  });
});
```

## Documentation

### Writing Docs

- Documentation lives in `apps/docs/`
- Use Markdown with clear structure and examples
- Link to code examples from the repo
- Keep language accessible (avoid excessive jargon)

### Key Docs to Update

When adding a feature, update:

1. `apps/docs/ARCHITECTURE.md` — If you change internal structure
2. `apps/docs/SESSION_FORMAT.md` — If you change session schema
3. `apps/docs/CLI.md` — If you add/change CLI commands
4. Package `README.md` — If you add new public APIs

## Release Process

We follow semantic versioning. Release process:

1. Update version in `packages/*/package.json`
2. Update `CHANGELOG.md`
3. Create a git tag: `git tag v0.2.0`
4. Push tag and packages to npm

(This is automated via CI/CD)

## Getting Help

- 💬 **Questions?** Open a [discussion](https://github.com/yumdee/mcp-studio/discussions)
- 🐛 **Found a bug?** Open an [issue](https://github.com/yumdee/mcp-studio/issues)
- 🤝 **Want to collaborate?** DM on Twitter or email (see profile)

## Code of Conduct

This project adopts the [Contributor Covenant](CODE_OF_CONDUCT.md). Please be respectful and constructive in all interactions.

## License

By contributing, you agree that your code will be licensed under the MIT License.

---

**Happy contributing!** 🚀
└── bench/ # Compliance scoring

apps/
└── docs/ # Documentation site

examples/ # Sample MCP servers

````

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
````

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
