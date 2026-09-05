/**
 * Live Demonstration: Testing a Real MCP Server from the Internet
 *
 * Connects to Anthropic's official reference server from npm:
 * `@modelcontextprotocol/server-everything`
 *
 * Demonstrates:
 * 1. Live handshake & tool introspection over stdio.
 * 2. Real remote tool invocations ('echo', 'get-sum').
 * 3. Dynamic Semantic Tool Routing across real internet tools.
 * 4. AI Diagnostic Copilot analyzing an error on a real internet tool.
 */

import { createStdioClient } from "../packages/core/src/index.js";
import { SemanticToolRouter } from "../packages/agent-kit/src/index.js";
import { diagnoseToolFailure } from "../packages/inspector/src/diagnostics.js";

console.log("================================================================================");
console.log("🌐 CONNECTING TO OFFICIAL INTERNET MCP SERVER: @modelcontextprotocol/server-everything");
console.log("================================================================================\n");

async function main() {
  console.log("1. Spawning official Anthropic MCP server via npx...");
  const client = createStdioClient("npx", ["-y", "@modelcontextprotocol/server-everything"]);
  
  const startTime = Date.now();
  await client.connect();
  const latency = Date.now() - startTime;

  const info = client.getServerInfo();
  console.log(`   ✅ Connected in ${latency}ms!`);
  console.log(`   Server Name:    ${info.name}`);
  console.log(`   Server Version: ${info.version}`);
  console.log(`   Transport:      ${info.transport}\n`);

  // ---------------------------------------------------------------------------
  // 2. DISCOVER REAL TOOLS
  // ---------------------------------------------------------------------------
  const tools = client.getTools();
  console.log(`2. Discovered ${tools.length} real tools from the internet:`);
  tools.forEach((t, i) => {
    console.log(`   [${(i + 1).toString().padStart(2, " ")}] ${t.name.padEnd(26)} - ${t.description || "No description"}`);
  });

  // ---------------------------------------------------------------------------
  // 3. INVOKE REAL TOOLS
  // ---------------------------------------------------------------------------
  console.log("\n3. Invoking real tools on the internet server:");

  // A. Call 'echo'
  console.log("   ➤ Calling 'echo' tool with message: 'Hello from MCP Studio!'...");
  const echoResult = await client.call("tools/call", {
    name: "echo",
    arguments: { message: "Hello from MCP Studio!" },
  });
  console.log("     Response:", JSON.stringify(echoResult));

  // B. Call 'get-sum'
  console.log("\n   ➤ Calling 'get-sum' tool with a = 125, b = 375...");
  const sumResult = await client.call("tools/call", {
    name: "get-sum",
    arguments: { a: 125, b: 375 },
  });
  console.log("     Response:", JSON.stringify(sumResult));

  // ---------------------------------------------------------------------------
  // 4. TEST SEMANTIC TOOL ROUTER ON REAL INTERNET TOOLS
  // ---------------------------------------------------------------------------
  console.log("\n4. Running Semantic Tool Router across internet server tools:");
  const router = new SemanticToolRouter({ topK: 2, minScore: 0.05 });
  await router.indexTools(tools);

  const query = "Compute the mathematical sum of two numbers";
  console.log(`   Query: "${query}"`);
  const routed = await router.route(query);
  console.log("   Selected by Vector Similarity:");
  for (const st of routed.selectedTools) {
    const score = routed.scores.find((s) => s.toolName === st.name)?.score;
    console.log(`     ✓ ${st.name.padEnd(24)} (Score: ${score})`);
  }
  console.log(`   Context Pruning: ${routed.metrics.prunedCount} unused tools removed from prompt`);
  console.log(`   Token Reduction: ${routed.metrics.reductionPercentage}% savings`);

  // ---------------------------------------------------------------------------
  // 5. TEST AI DIAGNOSTIC COPILOT ON REAL SERVER ERROR
  // ---------------------------------------------------------------------------
  console.log("\n5. Testing AI Diagnostic Copilot on real internet server error:");
  const sumTool = tools.find((t) => t.name === "get-sum");
  
  // Send invalid arguments: pass 'a' as string and omit 'b'
  const badArgs = { a: "one-hundred" };
  console.log("   Sending invalid arguments to 'get-sum':", JSON.stringify(badArgs));

  let errorOutput = "";
  try {
    await client.call("tools/call", {
      name: "get-sum",
      arguments: badArgs,
    });
  } catch (err: any) {
    errorOutput = err.message || String(err);
    console.log("   ❌ Server Rejected Invocation:", errorOutput);
  }

  const diagnosis = diagnoseToolFailure({
    toolName: "get-sum",
    schema: sumTool?.inputSchema,
    arguments: badArgs,
    error: errorOutput || "Missing required parameter b",
  });

  console.log("\n   ✨ AI DIAGNOSTIC COPILOT ANALYSIS:");
  console.log(`      - Category:    ${diagnosis.category}`);
  console.log(`      - Confidence:  ${Math.round(diagnosis.confidence * 100)}%`);
  console.log(`      - Root Cause:  ${diagnosis.rootCause}`);
  console.log(`      - Remediation: ${diagnosis.suggestedFix}`);
  console.log(`      - Auto-Patch:  ${JSON.stringify(diagnosis.correctedArgs)}`);

  await client.disconnect();
  console.log("\n================================================================================");
  console.log("🎉 INTERNET MCP SERVER TEST COMPLETED SUCCESSFULLY!");
  console.log("================================================================================");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
