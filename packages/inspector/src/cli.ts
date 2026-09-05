#!/usr/bin/env node

/**
 * MCP Studio Inspector CLI
 *
 * Entry point: npx mcp-studio-inspect
 *
 * Usage:
 *   mcp-studio-inspect                    # Start inspector at localhost:3000
 *   mcp-studio-inspect --port 4000        # Start at custom port
 */

import * as path from "path";
import { fileURLToPath } from "url";
import { createInspector } from "./server.js";

async function main() {
  const args = process.argv.slice(2);
  let port = 3000;

  const portFlagIdx = args.indexOf("--port");
  if (portFlagIdx !== -1 && args[portFlagIdx + 1]) {
    port = parseInt(args[portFlagIdx + 1], 10) || 3000;
  } else {
    const eqMatch = args.find((a) => a.startsWith("--port="));
    if (eqMatch) {
      port = parseInt(eqMatch.split("=")[1], 10) || 3000;
    }
  }

  let staticDir: string | undefined;
  try {
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    staticDir = path.resolve(currentDir, "../dist/ui");
  } catch {}

  const inspector = createInspector({ port, staticDir });

  try {
    await inspector.start();
    console.log(`\n🔍 MCP Studio Inspector running at http://localhost:${port}`);
    console.log("   Open in your browser to debug and replay MCP servers.\n");

    process.on("SIGINT", async () => {
      console.log("\n✋ Shutting down inspector server...");
      await inspector.stop();
      process.exit(0);
    });
  } catch (err) {
    console.error("Failed to start inspector:", err);
    process.exit(1);
  }
}

main();
