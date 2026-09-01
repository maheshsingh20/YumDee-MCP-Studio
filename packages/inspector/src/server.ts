/**
 * MCP Studio Inspector - Web UI Server
 *
 * Runs a local Express server that hosts the web UI for inspecting MCP servers.
 * Handles:
 * - WebSocket connections for live updates
 * - File serving for the React UI
 * - API endpoints for session management
 */

import http from "http";
import { McpClient, SessionStorage, McpSession } from "@yumdee/mcp-studio-core";

export interface InspectorConfig {
  port: number;
  host?: string;
  storage?: SessionStorage;
}

/**
 * Inspector server instance
 * Manages the web UI and orchestrates session recording/replay
 */
export class Inspector {
  private port: number;
  private host: string;
  private storage: SessionStorage;
  private server?: http.Server;
  private activeSessions: Map<string, McpClient> = new Map();

  constructor(config: InspectorConfig) {
    this.port = config.port;
    this.host = config.host || "localhost";
    this.storage = config.storage || ({ save: async () => "" } as any); // TODO: provide default
  }

  /**
   * Start the inspector server
   */
  async start(): Promise<void> {
    // TODO: Set up Express server
    // - Serve React UI from dist/ui/
    // - Set up WebSocket for live updates
    // - Set up REST API:
    //   - POST /api/sessions - create new recording session
    //   - GET /api/sessions/:id - load recorded session
    //   - GET /api/sessions - list all sessions
    //   - POST /api/sessions/:id/replay - replay a session
    //   - POST /api/servers/connect - connect to new server
    //   - GET /api/servers/:id/tools - list tools
    //   - POST /api/servers/:id/invoke - invoke tool manually
    console.log(`Inspector server would run on http://${this.host}:${this.port}`);
  }

  /**
   * Stop the inspector server
   */
  async stop(): Promise<void> {
    // TODO: Close server and all active sessions
  }

  /**
   * Connect to an MCP server for inspection
   */
  async connectToServer(client: McpClient): Promise<string> {
    const sessionId = crypto.randomUUID();
    this.activeSessions.set(sessionId, client);
    return sessionId;
  }

  /**
   * Get list of tools available on a server
   */
  async getTools(sessionId: string) {
    const client = this.activeSessions.get(sessionId);
    if (!client) throw new Error(`Session not found: ${sessionId}`);
    return client.getTools?.() || [];
  }

  /**
   * Invoke a tool on a server
   */
  async invokeTool(sessionId: string, toolName: string, args: Record<string, unknown>) {
    const client = this.activeSessions.get(sessionId);
    if (!client) throw new Error(`Session not found: ${sessionId}`);

    return client.call("tools/call", {
      name: toolName,
      arguments: args,
    });
  }

  /**
   * Save the current session
   */
  async saveSession(sessionId: string): Promise<string> {
    const client = this.activeSessions.get(sessionId);
    if (!client) throw new Error(`Session not found: ${sessionId}`);

    const session = client.getSession?.();
    if (!session) throw new Error(`No session recorded for ${sessionId}`);

    return this.storage.save(session);
  }
}

export function createInspector(config: InspectorConfig): Inspector {
  return new Inspector(config);
}
