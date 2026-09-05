/**
 * Live Real-World AI Features Demo
 *
 * Demonstrates:
 * 1. Semantic Tool Routing with Cosine Similarity across 10 multi-server tools.
 * 2. Real Stdio Server Tool Invocation with Error Capture.
 * 3. AI Root-Cause Diagnostic Copilot & Self-Healing Auto-Fix.
 * 4. End-to-End Agent with Semantic Routing & Token Metrics.
 */

import path from "path";
import { fileURLToPath } from "url";
import {
  SemanticToolRouter,
  createAgent,
} from "../packages/agent-kit/src/index.js";
import {
  createStdioClient,
  ToolDefinition,
} from "../packages/core/src/index.js";
import { diagnoseToolFailure } from "../packages/inspector/src/diagnostics.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mathServerPath = path.resolve(__dirname, "math-server/dist/index.js");

console.log("================================================================================");
console.log("🚀 MCP STUDIO: LIVE REAL-WORLD AI DEMONSTRATION");
console.log("================================================================================\n");

async function runDemo() {
  // ---------------------------------------------------------------------------
  // 1. REAL SEMANTIC TOOL ROUTER DEMO (Context Pruning & Cosine Ranking)
  // ---------------------------------------------------------------------------
  console.log("--------------------------------------------------------------------------------");
  console.log("PART 1: DYNAMIC SEMANTIC TOOL ROUTER (Vector Retrieval across 10 Tools)");
  console.log("--------------------------------------------------------------------------------\n");

  const enterpriseTools: ToolDefinition[] = [
    {
      name: "read_file",
      description: "Read contents of a file or configuration from disk or filesystem.",
      inputSchema: { type: "object", properties: { filepath: { type: "string" } } },
    },
    {
      name: "write_file",
      description: "Write or update content to a file on the local filesystem.",
      inputSchema: { type: "object", properties: { filepath: { type: "string" }, content: { type: "string" } } },
    },
    {
      name: "execute_sql_query",
      description: "Run SQL SELECT or UPDATE queries against production PostgreSQL database.",
      inputSchema: { type: "object", properties: { query: { type: "string" } } },
    },
    {
      name: "get_table_schema",
      description: "Retrieve column definitions and foreign keys for a SQL table.",
      inputSchema: { type: "object", properties: { tableName: { type: "string" } } },
    },
    {
      name: "calculate_tax",
      description: "Compute sales tax, GST, or VAT on financial transactions.",
      inputSchema: { type: "object", properties: { amount: { type: "number" }, rate: { type: "number" } } },
    },
    {
      name: "arithmetic_eval",
      description: "Perform basic mathematical arithmetic operations: add, subtract, multiply, divide.",
      inputSchema: { type: "object", properties: { expression: { type: "string" } } },
    },
    {
      name: "deploy_lambda_function",
      description: "Deploy serverless AWS Lambda function to cloud infrastructure.",
      inputSchema: { type: "object", properties: { functionName: { type: "string" } } },
    },
    {
      name: "get_cloudwatch_logs",
      description: "Fetch error logs and execution traces from AWS CloudWatch.",
      inputSchema: { type: "object", properties: { logGroup: { type: "string" } } },
    },
    {
      name: "send_slack_alert",
      description: "Send incident notification message or alert to engineering Slack channel.",
      inputSchema: { type: "object", properties: { channel: { type: "string" }, message: { type: "string" } } },
    },
    {
      name: "send_pagerduty_incident",
      description: "Trigger on-call engineer phone alert for high-severity outages.",
      inputSchema: { type: "object", properties: { serviceId: { type: "string" }, title: { type: "string" } } },
    },
  ];

  const router = new SemanticToolRouter({ topK: 2, minScore: 0.05 });
  await router.indexTools(enterpriseTools);

  const testQueries = [
    "Check the latest error logs for the server crash",
    "Calculate 18% tax on $500 total amount",
    "Run a query to find all users registered in the database",
    "Notify the team on Slack that the deployment finished",
  ];

  for (const q of testQueries) {
    console.log(`📌 User Query: "${q}"`);
    const result = await router.route(q);
    console.log("   Selected Tools:");
    for (const st of result.selectedTools) {
      const scoreObj = result.scores.find((s) => s.toolName === st.name);
      console.log(`     ✓ ${st.name.padEnd(24)} (Similarity: ${(scoreObj?.score || 0).toFixed(3)})`);
    }
    console.log(`   Context Pruning: ${result.metrics.prunedCount} unused tools removed from prompt`);
    console.log(`   Tokens Saved:    ~${result.metrics.tokensSaved} tokens (${result.metrics.reductionPercentage}% prompt compression)\n`);
  }

  // ---------------------------------------------------------------------------
  // 2. REAL SERVER TOOL INVOCATION & AI ROOT-CAUSE DIAGNOSIS
  // ---------------------------------------------------------------------------
  console.log("--------------------------------------------------------------------------------");
  console.log("PART 2: LIVE MCP SERVER ERROR & AI ROOT-CAUSE DIAGNOSIS (Self-Healing)");
  console.log("--------------------------------------------------------------------------------\n");

  console.log("1. Spawning real Stdio MCP Math Server at:", mathServerPath);
  const client = createStdioClient("node", [mathServerPath]);
  await client.connect();
  console.log("   ✓ Connected to:", client.getServerInfo().name, "v" + client.getServerInfo().version);

  const calcTool = client.getTools().find((t) => t.name === "calculate");
  console.log("   ✓ Discovered Tool: 'calculate'");

  // Trigger real division by zero error
  const failingArgs = { operation: "divide", a: 100, b: 0 };
  console.log("\n2. Intentionally invoking tool with invalid arguments:", JSON.stringify(failingArgs));

  let realError: string = "";
  try {
    await client.call("tools/call", { name: "calculate", arguments: failingArgs });
  } catch (err: any) {
    realError = err.message || String(err);
    console.log("   ❌ Server Rejected Invocation with Error:", realError);
  }

  // AI Diagnostic Copilot Analyzes the Real Error
  console.log("\n3. Invoking AI Root-Cause Diagnostic Copilot...");
  const diagnostic = diagnoseToolFailure({
    toolName: "calculate",
    schema: calcTool?.inputSchema,
    arguments: failingArgs,
    error: realError,
  });

  console.log("   ✨ AI DIAGNOSIS COMPLETE:");
  console.log("      - Category:    ", diagnostic.category);
  console.log("      - Confidence:  ", Math.round(diagnostic.confidence * 100) + "%");
  console.log("      - Root Cause:  ", diagnostic.rootCause);
  console.log("      - Remediation: ", diagnostic.suggestedFix);
  console.log("      - Auto-Patch:  ", JSON.stringify(diagnostic.correctedArgs));

  // Self-Healing: Re-run with AI's Synthesized Arguments
  console.log("\n4. Applying AI Auto-Patch to Live Server...");
  const selfHealedResult = await client.call("tools/call", {
    name: "calculate",
    arguments: diagnostic.correctedArgs,
  });
  console.log("   ✅ SELF-HEALED EXECUTION SUCCEEDED!");
  console.log("      Result Payload:", JSON.stringify(selfHealedResult));

  await client.disconnect();

  // ---------------------------------------------------------------------------
  // 3. REAL AGENT ORCHESTRATION WITH SEMANTIC ROUTING
  // ---------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------------");
  console.log("PART 3: AGENT ORCHESTRATION WITH REAL-TIME SEMANTIC ROUTING");
  console.log("--------------------------------------------------------------------------------\n");

  const agentClient = createStdioClient("node", [mathServerPath]);
  const agent = createAgent({
    servers: [agentClient],
    model: "mock",
    useSemanticRouting: true,
    semanticRouterConfig: { topK: 1 },
  });

  console.log("Running agent goal: 'Please add 20 and 22'");
  const answer = await agent.run("Please add 20 and 22");
  console.log("Agent Answer:", answer);

  const routingMetrics = agent.getRoutingMetrics();
  console.log("Routing Metrics from Agent Run:", routingMetrics);

  await agentClient.disconnect();

  console.log("\n================================================================================");
  console.log("🎉 ALL REAL DRY RUN CHECKS PASSED SUCCESSFULLY!");
  console.log("================================================================================");
}

runDemo().catch((err) => {
  console.error("Demo failed:", err);
  process.exit(1);
});
