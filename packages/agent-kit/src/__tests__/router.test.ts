import { describe, it, expect } from "vitest";
import {
  SemanticToolRouter,
  SparseSemanticVectorizer,
  cosineSimilarity,
  createAgent,
} from "../index.js";
import { McpClient, McpEvent, ServerInfo, ToolDefinition } from "@yumdee/mcp-studio-core";

describe("Vector Similarity & Tokenizer", () => {
  it("computes cosine similarity accurately", () => {
    expect(cosineSimilarity([1, 0, 0], [0, 1, 0])).toBe(0);
    expect(cosineSimilarity([1, 1], [1, 1])).toBeCloseTo(1, 5);
    expect(cosineSimilarity([2, 0], [10, 0])).toBeCloseTo(1, 5);
    expect(cosineSimilarity([], [])).toBe(0);
  });

  it("tokenizes camelCase, snake_case, and subword n-grams", () => {
    const vectorizer = new SparseSemanticVectorizer();
    const tokens = vectorizer.tokenize("calculateTax_rate in postgresDB");
    expect(tokens).toContain("calculate");
    expect(tokens).toContain("tax");
    expect(tokens).toContain("rate");
    expect(tokens).toContain("postgres");
    expect(tokens).toContain("db");
  });
});

describe("SemanticToolRouter", () => {
  const tools: ToolDefinition[] = [
    {
      name: "calculate",
      description: "Perform mathematical calculations like addition, multiplication, division, and subtraction.",
      inputSchema: {
        type: "object",
        properties: {
          operation: { type: "string", description: "The arithmetic operation: add, subtract, multiply, divide" },
          a: { type: "number", description: "First operand" },
          b: { type: "number", description: "Second operand" },
        },
        required: ["operation", "a", "b"],
      },
    },
    {
      name: "read_file",
      description: "Read contents of a text or markdown file from the local filesystem.",
      inputSchema: {
        type: "object",
        properties: {
          filepath: { type: "string", description: "Absolute path to the target file on disk" },
        },
        required: ["filepath"],
      },
    },
    {
      name: "send_slack_message",
      description: "Post a chat notification message or alert to a team Slack channel.",
      inputSchema: {
        type: "object",
        properties: {
          channel: { type: "string", description: "Slack channel ID or name" },
          message: { type: "string", description: "Text message to send" },
        },
        required: ["channel", "message"],
      },
    },
    {
      name: "execute_sql_query",
      description: "Run SQL SELECT or UPDATE queries against the production PostgreSQL database.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "SQL query string to execute" },
          timeoutMs: { type: "number", description: "Query timeout in milliseconds" },
        },
        required: ["query"],
      },
    },
  ];

  it("routes math queries to calculate tool and prunes unrelated tools", async () => {
    const router = new SemanticToolRouter({ topK: 1, minScore: 0.05 });
    await router.indexTools(tools);

    const result = await router.route("What is 45 multiplied by 8?");
    expect(result.selectedTools.length).toBe(1);
    expect(result.selectedTools[0].name).toBe("calculate");
    expect(result.metrics.totalTools).toBe(4);
    expect(result.metrics.selectedCount).toBe(1);
    expect(result.metrics.prunedCount).toBe(3);
    expect(result.metrics.reductionPercentage).toBeGreaterThanOrEqual(70);
    expect(result.metrics.tokensSaved).toBeGreaterThan(0);
  });

  it("routes database queries to execute_sql_query", async () => {
    const router = new SemanticToolRouter({ topK: 2, minScore: 0.05 });
    await router.indexTools(tools);

    const result = await router.route("Run a SELECT count(*) from customer orders in postgres");
    expect(result.selectedTools.length).toBeGreaterThanOrEqual(1);
    expect(result.selectedTools[0].name).toBe("execute_sql_query");
  });

  it("routes file operations to read_file", async () => {
    const router = new SemanticToolRouter({ topK: 1, minScore: 0.05 });
    await router.indexTools(tools);

    const result = await router.route("Open and read the file from disk");
    expect(result.selectedTools[0].name).toBe("read_file");
  });

  it("supports custom embedding providers", async () => {
    // Mock dense embedding function
    const mockEmbedFn = async (text: string) => {
      const isMath = text.includes("math") || text.includes("calculate") || text.includes("add");
      return isMath ? [1, 0, 0] : [0, 1, 0];
    };

    const router = new SemanticToolRouter({
      topK: 1,
      minScore: 0.5,
      embedFn: mockEmbedFn,
    });
    await router.indexTools(tools);

    const result = await router.route("calculate 20 plus 30");
    expect(result.selectedTools[0].name).toBe("calculate");
  });
});

describe("Agent with Semantic Routing", () => {
  it("runs with semantic routing enabled and tracks token savings metrics", async () => {
    const mockClient: McpClient = {
      connect: async () => ({ name: "math-server", version: "1.0.0", transport: "stdio" as const }),
      disconnect: async () => {},
      isConnected: () => true,
      call: async <R = any>() => ({ content: [{ type: "text", text: "42" }] } as unknown as R),
      notify: async () => {},
      onNotification: () => () => {},
      getCapabilities: () => ({}),
      getSession: () => ({
        id: "mock-session",
        serverInfo: { name: "math-server", version: "1.0.0", transport: "stdio" },
        clientInfo: { name: "yumdee-mcp-studio", version: "0.1.0" },
        startedAt: new Date().toISOString(),
        events: [],
      }),
      clearSession: () => {},
      getServerInfo: () => ({ name: "math-server", version: "1.0.0", transport: "stdio" } as ServerInfo),
      getTools: () => [
        {
          name: "add",
          description: "Add two numbers together",
          inputSchema: { type: "object", properties: { a: { type: "number" }, b: { type: "number" } } },
        },
        {
          name: "delete_database",
          description: "Drop all tables in database",
          inputSchema: { type: "object", properties: {} },
        },
      ],
      getResources: () => [],
      getPrompts: () => [],
      getEvents: () => [] as McpEvent[],
    };

    const agent = createAgent({
      servers: [mockClient],
      model: "mock",
      useSemanticRouting: true,
      semanticRouterConfig: { topK: 1 },
    });

    const result = await agent.run("Please add two numbers");
    expect(result).toBe("The calculation was completed successfully. The answer is 42.");

    const metrics = agent.getRoutingMetrics();
    expect(metrics).toBeDefined();
    expect(metrics?.totalTools).toBe(2);
    expect(metrics?.selectedCount).toBe(1);
    expect(metrics?.prunedCount).toBe(1);
    expect(metrics?.reductionPercentage).toBe(50);
  });
});
