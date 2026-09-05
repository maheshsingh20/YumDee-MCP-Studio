#!/usr/bin/env node

/**
 * MCP Studio CLI
 *
 * Entry point: npx mcp-studio
 *
 * Commands:
 *   mcp-studio search <keyword>     # Search for servers
 *   mcp-studio list                 # List all available servers
 *   mcp-studio add <name>           # Install server to Claude Desktop / Cursor
 *   mcp-studio validate             # Validate all server listings
 */

import { promises as fs } from "fs";
import * as path from "path";
import * as os from "os";
import { createRegistry, ServerListing } from "./registry.js";

function getClaudeConfigPath(): string {
  const platform = process.platform;
  if (platform === "win32") {
    const appData = process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
    return path.join(appData, "Claude", "claude_desktop_config.json");
  } else if (platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", "Claude", "claude_desktop_config.json");
  } else {
    return path.join(os.homedir(), ".config", "Claude", "claude_desktop_config.json");
  }
}

function getCursorConfigPath(): string {
  return path.join(os.homedir(), ".cursor", "mcp.json");
}

async function addServerToConfig(server: ServerListing, targetApp: "claude" | "cursor" = "claude") {
  const configPath = targetApp === "claude" ? getClaudeConfigPath() : getCursorConfigPath();
  const configDir = path.dirname(configPath);

  await fs.mkdir(configDir, { recursive: true });

  let config: Record<string, any> = { mcpServers: {} };
  try {
    const existing = await fs.readFile(configPath, "utf8");
    config = JSON.parse(existing);
    if (!config.mcpServers) config.mcpServers = {};

    // Backup existing configuration
    await fs.writeFile(`${configPath}.bak`, existing, "utf8");
    console.log(`📋 Created backup at ${configPath}.bak`);
  } catch (err: any) {
    if (err.code !== "ENOENT") {
      console.warn("⚠️ Warning: could not parse existing config, creating fresh configuration.");
    }
  }

  // Parse command & arguments
  let command = server.command || "npx";
  let args: string[] = [];
  if (server.command && server.command.includes(" ")) {
    const parts = server.command.split(" ");
    command = parts[0];
    args = parts.slice(1);
  }

  config.mcpServers[server.name] = {
    command,
    args,
    env: {},
  };

  await fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf8");
  console.log(`✅ Successfully added "${server.displayName}" (${server.name}) to ${targetApp} config!`);
  console.log(`📁 Config path: ${configPath}`);
}

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
          const verified = server.verified ? "✓ [Verified]" : "";
          console.log(`📦 ${server.displayName} (${server.name}) ${verified}`);
          console.log(`   Description: ${server.description}`);
          console.log(`   Command:     ${server.command || server.endpoint || "N/A"}`);
          console.log(`   Homepage:    ${server.homepage}`);
          console.log();
        });
      }
      break;
    }

    case "list": {
      const servers = registry.list();
      console.log(`Available servers: ${servers.length}\n`);
      servers.forEach((server) => {
        const verified = server.verified ? "✓" : " ";
        const tags = server.tags ? `[${server.tags.join(", ")}]` : "";
        console.log(`[${verified}] ${server.displayName.padEnd(22)} (${server.name.padEnd(16)}) ${tags}`);
      });
      break;
    }

    case "add": {
      const name = args[1];
      if (!name) {
        console.error("Usage: mcp-studio add <name> [--target claude|cursor]");
        process.exit(1);
      }
      const targetFlag = args.includes("--cursor") || args.includes("cursor") ? "cursor" : "claude";
      const server = registry.get(name);
      if (!server) {
        console.error(`Error: Server "${name}" not found in registry.`);
        console.error("Run 'mcp-studio list' to see all available servers.");
        process.exit(1);
      }

      console.log(`Installing ${server.displayName} (${server.name})...`);
      await addServerToConfig(server, targetFlag);
      break;
    }

    case "validate": {
      console.log("Validating all server listings in registry...");
      const servers = registry.list();
      let errors = 0;

      for (const server of servers) {
        if (!server.name || !server.command && !server.endpoint) {
          console.error(`❌ Invalid listing: ${server.name} missing command or endpoint.`);
          errors++;
        } else {
          console.log(`✓ ${server.name} valid (${server.transport})`);
        }
      }

      if (errors > 0) {
        console.error(`\nValidation completed with ${errors} error(s).`);
        process.exit(1);
      } else {
        console.log(`\nAll ${servers.length} server listings validated successfully!`);
      }
      break;
    }

    default: {
      console.log("MCP Studio - Model Context Protocol toolkit");
      console.log("\nUsage: mcp-studio <command> [args]\n");
      console.log("Commands:");
      console.log("  search <keyword>                   Search for servers");
      console.log("  list                               List all servers");
      console.log("  add <name> [--target cursor]       Install a server into Claude Desktop / Cursor");
      console.log("  validate                           Validate server listings");
      break;
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
