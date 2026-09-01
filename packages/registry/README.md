# @yumdee/mcp-studio-registry

Community directory of MCP servers + CLI installer.

## Commands

```bash
# Discovery
mcp-studio search <keyword>     # Search registry
mcp-studio list                 # List all servers
mcp-studio info <server-name>   # Show server details

# Installation
mcp-studio add <server-name>    # Install + configure
mcp-studio remove <server-name>
mcp-studio list-installed

# Development
mcp-studio inspect <server-name> # Start debugger
mcp-studio bench <server-name>   # Score compliance
```

## Contributing a Server

1. Create `servers/your-server-name.json`:
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

2. Submit a PR — CI validates schema + pings server

## Development

See [../../CONTRIBUTING.md](../../CONTRIBUTING.md)
