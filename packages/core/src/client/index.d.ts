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
    connect(): Promise<ServerInfo>;
    disconnect(): Promise<void>;
    isConnected(): boolean;
    call<P = unknown, R = unknown>(method: string, params?: P): Promise<R>;
    notify(method: string, params?: unknown): Promise<void>;
    onNotification(callback: (method: string, params: unknown) => void): () => void;
    getServerInfo(): ServerInfo;
    getCapabilities(): Record<string, unknown>;
    getTools(): ToolDefinition[];
    getResources(): ResourceDefinition[];
    getPrompts(): PromptDefinition[];
    getSession(): McpSession;
    getEvents(): McpEvent[];
    clearSession(): void;
}
/**
 * Create a stdio-based MCP client
 *
 * @param command - Command to spawn (e.g., "npx postgres-mcp")
 * @param args - Optional arguments to pass to the command
 * @param env - Optional environment variables
 */
export declare function createStdioClient(command: string, args?: string[], env?: Record<string, string>): McpClient;
/**
 * Create an SSE-based MCP client
 *
 * @param url - SSE endpoint URL (e.g., "http://localhost:3000/sse")
 * @param headers - Optional HTTP headers
 */
export declare function createSseClient(url: string, headers?: Record<string, string>): McpClient;
/**
 * Create an HTTP-based MCP client
 *
 * @param url - JSON-RPC endpoint URL
 * @param headers - Optional HTTP headers
 */
export declare function createHttpClient(url: string, headers?: Record<string, string>): McpClient;
//# sourceMappingURL=index.d.ts.map