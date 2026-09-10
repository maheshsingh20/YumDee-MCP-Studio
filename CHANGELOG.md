# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-09-10

### Added
- **Interactive Quick Presets**: 1-click connect chips in Inspector UI for local stdio servers, live public HTTP endpoints (`https://aisenseapi.com/mcp`), and official npm packages (`@modelcontextprotocol/server-memory`, `@modelcontextprotocol/server-filesystem`, `@modelcontextprotocol/server-everything`).
- **Embedding Vector Cache**: High-performance in-memory vector cache in `SemanticToolRouter` avoiding redundant external API roundtrips and reducing routing latency and token costs.
- **Security Audit Report Export**: 1-click Markdown (`.md`) and JSON export functionality in `SecurityAuditView` with full vulnerability breakdowns.
- **Gemini 2.0 Integration & Schema Sanitization**: Support for `gemini-2.0-flash` and `gemini-embedding-001` with automated cleaning of unsupported JSON Schema keywords (`$schema`, `$defs`) for reliable LLM tool calling.
- **Native HTTP Mode for Example Math Server**: Added `--port` / `--http` flags to `examples/math-server` for local HTTP MCP testing.

### Changed
- Bumped workspace packages (`@yumdee/mcp-studio-*`) to version `0.3.0`.
- Updated Inspector UI navbar version badge to `v0.3.0`.

## [0.2.0] - 2026-09-06

### Added
- Gemini AI Diagnostic Copilot and Live Multi-Server Agent Playground.
- Automated Security & Prompt-Injection Auditor.
- Community server registry seeding and CLI additions.

- **Core Package**
  - Session recording schema (`McpSession`, `McpEvent`) with Zod validation
  - MCP client interface abstraction supporting stdio, SSE, and HTTP transports
  - Session storage interface with in-memory implementation
  - Comprehensive TypeScript type definitions for MCP protocol

- **Inspector Package**
  - Web UI server scaffolding with Express/Vite integration
  - CLI entry point for starting the inspector (`mcp-studio-inspect`)
  - React UI component structure for server debugging
  - Session management API structure

- **Registry Package**
  - Community server listing schema (Zod-validated)
  - Server registry class with search/filter/list capabilities
  - CLI commands: `search`, `list`, `add`, `validate`
  - Example server listings (PostgreSQL, Filesystem, GitHub)

- **Agent-kit Package**
  - Agent orchestrator class for multi-server composition
  - Agent configuration interface
  - Session recording integration

- **Bench Package**
  - Benchmark runner for compliance scoring
  - Regression detection infrastructure
  - Report generation utilities

- **Documentation**
  - Architecture documentation with design principles
  - Session format specification
  - CLI usage guide
  - Comprehensive CONTRIBUTING.md

- **Examples**
  - Math calculator example MCP server (stdio-based)
  - Example server documentation

### Changed

- N/A (initial release scaffolding)

### Fixed

- N/A

### Deprecated

- N/A

### Removed

- N/A

### Security

- N/A

## [0.1.0] - 2024-01-20

### Initial Release

Initial monorepo scaffolding for MCP Studio with:

- Project structure and build configuration
- Package initialization with proper TypeScript setup
- Documentation framework
- Development workflow

[Unreleased]: https://github.com/maheshsingh20/YumDee-MCP-Studio/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/maheshsingh20/YumDee-MCP-Studio/releases/tag/v0.1.0
