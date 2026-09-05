#!/usr/bin/env node

/**
 * MCP Studio Bench CLI
 *
 * Usage:
 *   mcp-studio-bench <path-to-session.json> [--min-score 80]
 */

import { promises as fs } from "fs";
import * as path from "path";
import { createBenchmark } from "./index.js";
import { parseSession } from "@yumdee/mcp-studio-core";

async function main() {
  const args = process.argv.slice(2);
  const sessionPath = args[0];

  if (!sessionPath || sessionPath === "--help" || sessionPath === "-h") {
    console.log("MCP Studio Bench - Compliance Scoring & CI Gating");
    console.log("\nUsage:");
    console.log("  mcp-studio-bench <path-to-session.json> [--min-score 80]\n");
    process.exit(sessionPath ? 0 : 1);
  }

  let minScore = 80;
  const minScoreIdx = args.indexOf("--min-score");
  if (minScoreIdx !== -1 && args[minScoreIdx + 1]) {
    minScore = parseInt(args[minScoreIdx + 1], 10) || 80;
  }

  const resolved = path.resolve(sessionPath);
  const content = await fs.readFile(resolved, "utf8");
  const session = parseSession(JSON.parse(content));

  const bench = createBenchmark({ minScore });
  const score = bench.scoreSession(session);

  console.log(bench.generateReport(score));

  if (score.overall < minScore) {
    console.error(`\n❌ CI Check Failed: Score ${score.overall} is below threshold ${minScore}.`);
    process.exit(1);
  } else {
    console.log(`\n✅ CI Check Passed: Score ${score.overall} meets or exceeds threshold ${minScore}.`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Bench execution failed:", err);
  process.exit(1);
});
