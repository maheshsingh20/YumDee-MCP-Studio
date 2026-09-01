/**
 * MCP Client Interface
 *
 * Abstract interface for all MCP client implementations.
 * Handles the JSON-RPC protocol and session recording.
 *
 * All transports (stdio, SSE, HTTP) implement this interface.
 */

import { McpSession, McpEvent, ServerInfo, ToolDefinition, ResourceDefinition, PromptDefinition } from "../schemas/index.js";

export interface McpClient {
  // Lifecycle
  connect(): Promise<ServerInfo>;
  disconnect(): Promise<void>;
  isConnected(): boolean;

  // Request/response (blocking call + response)
  call<P = unknown, R = unknown>(method: string, params?: P): Promise<R>;

  // Notifications (fire-and-forget)
  notify(method: string, params?: unknown): Promise<void>;

  // Server-to-client notifications (subscription)
  onNotification(callback: (method: string, params: unknown) => void): () => void;

  // Introspection (after handshake, these are cached)
  getServerInfo(): ServerInfo;
  getCapabilities(): Record<string, unknown>;
  getTools(): ToolDefinition[]; // from list_tools
  getResources(): ResourceDefinition[]; // from list_resources
  getPrompts(): PromptDefinition[]; // from list_prompts

  // Session recording (auto-recorded for every call/notify/notification)
  getSession(): McpSession;
  getEvents(): McpEvent[];
  clearSession(): void;
}

// ============================================================================
// Transport-Specific Constructors
// ============================================================================

/**
 * Create a stdio-based MCP client
 *
 * @param command - Command to spawn (e.g., "npx postgres-mcp")
 * @param args - Optional arguments to pass to the command
 * @param env - Optional environment variables
 */
export function createStdioClient(
  command: string,
  args?: string[],
  env?: Record<string, string>
): McpClient {
  // TODO: Implement
  throw new Error("Not yet implemented");
}

/**
 * Create an SSE-based MCP client
 *
 * @param url - SSE endpoint URL (e.g., "http://localhost:3000/sse")
 * @param headers - Optional HTTP headers
 */
export function createSseClient(
  url: string,
  headers?: Record<string, string>
): McpClient {
  // TODO: Implement
  throw new Error("Not yet implemented");
}

/**
 * Create an HTTP-based MCP client
 *
 * @param url - JSON-RPC endpoint URL
 * @param headers - Optional HTTP headers
 */
export function createHttpClient(
  url: string,
  headers?: Record<string, string>
): McpClient {
  // TODO: Implement
  throw new Error("Not yet implemented");
}
