#!/usr/bin/env node

/**
 * MCP Studio CLI
 *
 * Entry point: npx mcp-studio
 *
 * Commands:
 *   mcp-studio search <keyword>     # Search for servers
 *   mcp-studio list                 # List all available servers
 *   mcp-studio add <name>           # Install a server
 *   mcp-studio validate             # Validate server listings
 */

import { createRegistry } from "./registry.js";

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const registry = createRegistry();
  await registry.load();

  switch (command) {
    case "search": {
      const keyword = args[1];
      if (!keyword) {
        console.error("Usage: mcp-studio search <keyword>");
        process.exit(1);
      }
      const results = registry.search(keyword);
      if (results.length === 0) {
        console.log(`No servers found matching "${keyword}"`);
      } else {
        console.log(`Found ${results.length} server(s):\n`);
        results.forEach((server) => {
          console.log(`📦 ${server.displayName} (${server.name})`);
          console.log(`   ${server.description}`);
          console.log(`   ${server.homepage}`);
          console.log();
        });
      }
      break;
    }

    case "list": {
      const servers = registry.list();
      console.log(`Available servers: ${servers.length}\n`);
      servers.forEach((server) => {
        const verified = server.verified ? "✓" : "?";
        console.log(`${verified} ${server.displayName} (${server.name})`);
      });
      break;
    }

    case "add": {
      const name = args[1];
      if (!name) {
        console.error("Usage: mcp-studio add <name>");
        process.exit(1);
      }
      const server = registry.get(name);
      if (!server) {
        console.error(`Server not found: ${name}`);
        process.exit(1);
      }
      console.log(`Installing ${server.displayName}...`);
      console.log("TODO: Configure server in Claude Desktop / Cursor config");
      break;
    }

    case "validate": {
      console.log("Validating all server listings...");
      console.log("TODO: Run CI validation against all servers");
      break;
    }

    default: {
      console.log("MCP Studio - Model Context Protocol toolkit");
      console.log("\nUsage: mcp-studio <command> [args]\n");
      console.log("Commands:");
      console.log("  search <keyword>  Search for servers");
      console.log("  list              List all servers");
      console.log("  add <name>        Install a server");
      console.log("  validate          Validate server listings");
      break;
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
