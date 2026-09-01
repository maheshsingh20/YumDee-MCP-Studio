/**
 * @yumdee/mcp-studio-agent-kit
 *
 * Orchestration layer for composing multiple MCP servers into an agent.
 *
 * Allows chaining multiple installed MCP servers with different reasoning models:
 * - Anthropic Claude
 * - OpenAI GPT
 * - Ollama (local models)
 */

import { McpClient, McpSession } from "@yumdee/mcp-studio-core";

/**
 * Agent configuration
 */
export interface AgentConfig {
  servers: McpClient[];
  model: "claude" | "gpt" | "ollama";
  modelName?: string;
  maxSteps?: number;
}

/**
 * Agent orchestrator
 *
 * Chains multiple MCP servers together with a reasoning model,
 * automatically recording all steps into a single McpSession.
 */
export class Agent {
  private servers: McpClient[];
  private model: "claude" | "gpt" | "ollama";
  private maxSteps: number;
  private session?: McpSession;

  constructor(config: AgentConfig) {
    this.servers = config.servers;
    this.model = config.model;
    this.maxSteps = config.maxSteps || 10;
  }

  /**
   * Run the agent with a goal
   */
  async run(goal: string): Promise<string> {
    // TODO: Implement agent loop
    // 1. Call reasoning model with goal + available tools from all servers
    // 2. Model selects a tool and parameters
    // 3. Execute tool on the appropriate server
    // 4. Record all steps in a combined session
    // 5. Feed result back to model
    // 6. Repeat until max steps or goal reached
    throw new Error("Not yet implemented");
  }

  /**
   * Get the session recording for this agent run
   */
  getSession(): McpSession | undefined {
    return this.session;
  }
}

export function createAgent(config: AgentConfig): Agent {
  return new Agent(config);
}
