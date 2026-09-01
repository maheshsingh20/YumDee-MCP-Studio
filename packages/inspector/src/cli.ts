#!/usr/bin/env node

/**
 * MCP Studio Inspector CLI
 *
 * Entry point: npx mcp-studio-inspect
 *
 * Usage:
 *   mcp-studio-inspect                    # Start inspector at localhost:3000
 *   mcp-studio-inspect --port 4000        # Start at custom port
 *   mcp-studio-inspect <command> [args]   # Run command
 */

import { createInspector } from "./server.js";

async function main() {
  const args = process.argv.slice(2);
  const port = parseInt(args.find((arg) => arg.startsWith("--port="))?.split("=")[1] || "3000");

  const inspector = createInspector({ port });

  try {
    await inspector.start();
    console.log(`🔍 Inspector started at http://localhost:${port}`);
    console.log("   Open in your browser or use the CLI to connect to an MCP server");

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      console.log("\n✋ Shutting down...");
      await inspector.stop();
      process.exit(0);
    });
  } catch (err) {
    console.error("Failed to start inspector:", err);
    process.exit(1);
  }
}

main();
