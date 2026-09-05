/**
 * @yumdee/mcp-studio-agent-kit
 *
 * Orchestration layer for composing multiple MCP servers into a unified agent.
 *
 * Supports chaining multiple MCP servers with different reasoning models:
 * - Local Ollama models (free, local, no API keys needed)
 * - OpenAI GPT
 * - Anthropic Claude
 * - Deterministic/Mock agent for testing & offline workflows
 */

import { randomUUID } from "crypto";
import { McpClient, McpSession, McpEvent, ToolDefinition } from "@yumdee/mcp-studio-core";
import {
  SemanticToolRouter,
  SemanticRouterConfig,
  RouteResult,
  SparseSemanticVectorizer,
  cosineSimilarity,
} from "./router.js";

export {
  SemanticToolRouter,
  SemanticRouterConfig,
  RouteResult,
  SparseSemanticVectorizer,
  cosineSimilarity,
};

/**
 * Agent configuration
 */
export interface AgentConfig {
  servers: McpClient[];
  model: "claude" | "gpt" | "ollama" | "mock";
  modelName?: string;
  apiKey?: string;
  baseUrl?: string;
  maxSteps?: number;
  systemPrompt?: string;
  /**
   * Enable dynamic semantic tool routing using vector embeddings
   * Prunes unused tools from prompts, drastically reducing tokens and preventing hallucination.
   */
  useSemanticRouting?: boolean;
  semanticRouterConfig?: SemanticRouterConfig;
}

interface DiscoveredTool {
  client: McpClient;
  originalName: string;
  uniqueName: string;
  definition: ToolDefinition;
}

/**
 * Agent orchestrator
 */
export class Agent {
  private servers: McpClient[];
  private model: "claude" | "gpt" | "ollama" | "mock";
  private modelName: string;
  private apiKey?: string;
  private baseUrl?: string;
  private maxSteps: number;
  private systemPrompt?: string;
  private useSemanticRouting: boolean;
  private router?: SemanticToolRouter;
  private lastRoutingMetrics?: RouteResult["metrics"];
  private toolsMap: Map<string, DiscoveredTool> = new Map();
  private session?: McpSession;

  constructor(config: AgentConfig) {
    this.servers = config.servers;
    this.model = config.model;
    this.modelName = config.modelName || (config.model === "ollama" ? "llama3" : config.model === "claude" ? "claude-3-5-sonnet-20241022" : "gpt-4o");
    this.apiKey = config.apiKey || (config.model === "claude" ? process.env.ANTHROPIC_API_KEY : process.env.OPENAI_API_KEY);
    this.baseUrl = config.baseUrl;
    this.maxSteps = config.maxSteps || 10;
    this.systemPrompt = config.systemPrompt;
    this.useSemanticRouting = config.useSemanticRouting ?? false;
    if (this.useSemanticRouting) {
      this.router = new SemanticToolRouter(config.semanticRouterConfig);
    }
  }

  /**
   * Introspect and aggregate tools across all connected MCP servers
   */
  async discoverTools(): Promise<Map<string, DiscoveredTool>> {
    this.toolsMap.clear();

    for (const client of this.servers) {
      if (!client.isConnected()) {
        await client.connect();
      }

      const sInfo = client.getServerInfo();
      const clientTools = client.getTools();

      for (const tool of clientTools) {
        let uniqueName = tool.name;
        if (this.toolsMap.has(uniqueName)) {
          uniqueName = `${sInfo.name}__${tool.name}`;
        }

        this.toolsMap.set(uniqueName, {
          client,
          originalName: tool.name,
          uniqueName,
          definition: {
            ...tool,
            name: uniqueName,
          },
        });
      }
    }

    return this.toolsMap;
  }

  /**
   * Run the agent to achieve a goal
   */
  async run(goal: string): Promise<string> {
    await this.discoverTools();

    if (this.useSemanticRouting && this.router) {
      const toolDefs = Array.from(this.toolsMap.values()).map((t) => t.definition);
      await this.router.indexTools(toolDefs);
    }

    const sessionId = randomUUID();
    const startedAt = new Date().toISOString();

    const messages: Array<{ role: string; content: any }> = [
      {
        role: "system",
        content:
          this.systemPrompt ||
          `You are an autonomous AI agent equipped with tools from multiple Model Context Protocol (MCP) servers. Your objective is to achieve the user's goal by selecting the right tools, analyzing results, and providing a final answer. Available tools: ${Array.from(this.toolsMap.keys()).join(", ")}.`,
      },
      {
        role: "user",
        content: goal,
      },
    ];

    let currentStep = 0;
    let finalAnswer = "";

    while (currentStep < this.maxSteps) {
      currentStep++;

      // Dynamically select tools using semantic routing if enabled
      let activeTools: DiscoveredTool[] = Array.from(this.toolsMap.values());
      if (this.useSemanticRouting && this.router) {
        const lastMsg = messages[messages.length - 1]?.content;
        const query = typeof lastMsg === "string" ? `${goal} ${lastMsg}` : goal;
        const routeResult = await this.router.route(query);
        this.lastRoutingMetrics = routeResult.metrics;
        const selectedNames = new Set(routeResult.selectedTools.map((t) => t.name));
        activeTools = activeTools.filter((t) => selectedNames.has(t.uniqueName) || selectedNames.has(t.originalName));
      }

      // Dispatch to model adapter with dynamically routed tools
      const stepResponse = await this.callModel(messages, activeTools);

      if (stepResponse.toolCalls && stepResponse.toolCalls.length > 0) {
        messages.push({
          role: "assistant",
          content: stepResponse.content || null,
        });

        for (const tc of stepResponse.toolCalls) {
          const toolHandler = this.toolsMap.get(tc.name);
          if (!toolHandler) {
            messages.push({
              role: "user",
              content: `Error: Tool "${tc.name}" is not registered. Available tools: ${Array.from(this.toolsMap.keys()).join(", ")}`,
            });
            continue;
          }

          try {
            const toolResult = await toolHandler.client.call("tools/call", {
              name: toolHandler.originalName,
              arguments: tc.args || {},
            });

            messages.push({
              role: "user",
              content: `Tool Result for ${tc.name}:\n${JSON.stringify(toolResult, null, 2)}`,
            });
          } catch (err: any) {
            messages.push({
              role: "user",
              content: `Tool Execution Error for ${tc.name}: ${err.message}`,
            });
          }
        }
      } else {
        finalAnswer = stepResponse.content || "Goal completed.";
        break;
      }
    }

    if (!finalAnswer && currentStep >= this.maxSteps) {
      finalAnswer = `Max execution steps (${this.maxSteps}) reached. Last state: ${JSON.stringify(messages[messages.length - 1].content)}`;
    }

    // Collate all events into a unified McpSession
    const allEvents: McpEvent[] = [];
    for (const client of this.servers) {
      allEvents.push(...client.getEvents());
    }
    allEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    this.session = {
      id: sessionId,
      serverInfo: {
        name: `orchestrated-agent [${this.servers.map((s) => s.getServerInfo().name).join(", ")}]`,
        version: "0.1.0",
        transport: "stdio",
      },
      clientInfo: {
        name: "yumdee-mcp-studio",
        version: "0.1.0",
      },
      startedAt,
      endedAt: new Date().toISOString(),
      events: allEvents,
      metadata: {
        tags: ["agent-run", this.model, ...(this.useSemanticRouting ? ["semantic-routing"] : [])],
        notes: `Goal: ${goal} | Steps: ${currentStep}`,
        routingMetrics: this.lastRoutingMetrics,
      },
    };

    return finalAnswer;
  }

  /**
   * Internal model dispatch
   */
  private async callModel(
    messages: any[],
    activeTools?: DiscoveredTool[]
  ): Promise<{ content?: string; toolCalls?: Array<{ name: string; args: any }> }> {
    const toolsPool = activeTools && activeTools.length > 0 ? activeTools : Array.from(this.toolsMap.values());

    if (this.model === "mock") {
      // Deterministic mock agent for tests and headless verification
      const lastMsg = messages[messages.length - 1].content;
      if (typeof lastMsg === "string" && lastMsg.toLowerCase().includes("add")) {
        const hasExecuted = messages.some((m) => typeof m.content === "string" && m.content.includes("Tool Result"));
        if (!hasExecuted) {
          return {
            toolCalls: [{ name: "add", args: { a: 20, b: 22 } }],
          };
        } else {
          return {
            content: "The calculation was completed successfully. The answer is 42.",
          };
        }
      }
      return { content: "Mock goal processed." };
    }

    if (this.model === "ollama") {
      const host = this.baseUrl || process.env.OLLAMA_HOST || "http://localhost:11434";
      const tools = toolsPool.map((t) => ({
        type: "function",
        function: {
          name: t.uniqueName,
          description: t.definition.description || "",
          parameters: t.definition.inputSchema || { type: "object", properties: {} },
        },
      }));

      const res = await fetch(`${host}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.modelName,
          messages,
          tools,
          stream: false,
        }),
      });

      if (!res.ok) throw new Error(`Ollama request failed: ${res.statusText}`);
      const data: any = await res.json();
      const msg = data.message || {};
      const toolCalls = msg.tool_calls?.map((tc: any) => ({
        name: tc.function?.name,
        args: tc.function?.arguments,
      }));

      return { content: msg.content, toolCalls };
    }

    if (this.model === "gpt") {
      if (!this.apiKey) {
        throw new Error("OPENAI_API_KEY is required for GPT model adapter");
      }
      const tools = toolsPool.map((t) => ({
        type: "function",
        function: {
          name: t.uniqueName,
          description: t.definition.description || "",
          parameters: t.definition.inputSchema || { type: "object", properties: {} },
        },
      }));

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.modelName,
          messages,
          tools: tools.length > 0 ? tools : undefined,
        }),
      });

      if (!res.ok) throw new Error(`OpenAI API error: ${res.statusText}`);
      const data: any = await res.json();
      const choice = data.choices?.[0]?.message;
      const toolCalls = choice?.tool_calls?.map((tc: any) => ({
        name: tc.function?.name,
        args: JSON.parse(tc.function?.arguments || "{}"),
      }));

      return { content: choice?.content, toolCalls };
    }

    if (this.model === "claude") {
      if (!this.apiKey) {
        throw new Error("ANTHROPIC_API_KEY is required for Claude model adapter");
      }
      const tools = toolsPool.map((t) => ({
        name: t.uniqueName,
        description: t.definition.description || "",
        input_schema: t.definition.inputSchema || { type: "object", properties: {} },
      }));

      // Extract system message for Anthropic format
      const system = messages.find((m) => m.role === "system")?.content;
      const conversation = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }));

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: this.modelName,
          max_tokens: 1024,
          system,
          messages: conversation,
          tools: tools.length > 0 ? tools : undefined,
        }),
      });

      if (!res.ok) throw new Error(`Anthropic API error: ${res.statusText}`);
      const data: any = await res.json();
      const toolUseBlocks = data.content?.filter((c: any) => c.type === "tool_use");
      const textBlocks = data.content?.filter((c: any) => c.type === "text").map((c: any) => c.text).join("\n");

      const toolCalls = toolUseBlocks?.map((tb: any) => ({
        name: tb.name,
        args: tb.input,
      }));

      return { content: textBlocks, toolCalls };
    }

    return { content: "Unsupported model" };
  }

  /**
   * Get the session recording for this agent run
   */
  getSession(): McpSession | undefined {
    return this.session;
  }

  /**
   * Get metrics from the latest semantic routing step
   */
  getRoutingMetrics(): RouteResult["metrics"] | undefined {
    return this.lastRoutingMetrics;
  }

  /**
   * Get the underlying SemanticToolRouter instance
   */
  getRouter(): SemanticToolRouter | undefined {
    return this.router;
  }
}

export function createAgent(config: AgentConfig): Agent {
  return new Agent(config);
}

