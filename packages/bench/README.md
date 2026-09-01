# @yumdee/mcp-studio-bench

Compliance & reliability scoring for MCP servers.

## Features

- Spec compliance checks (handshake format, error format, type consistency)
- Reliability metrics (success rate, latency percentiles)
- Replay-based scoring (no live network calls)
- CI-gatable pass/fail gates (`bench check --min-score 80`)

## Usage

```bash
mcp-studio-bench <server-name>
mcp-studio-bench <session-id> --replay  # Replay a recorded session
mcp-studio-bench check --min-score 80   # CI gate
```

## Development

See [../../CONTRIBUTING.md](../../CONTRIBUTING.md)
