/**
 * MCP Client Interface
 *
 * Abstract interface for all MCP client implementations.
 * Handles the JSON-RPC protocol and session recording.
 *
 * All transports (stdio, SSE, HTTP) implement this interface.
 */
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
export function createStdioClient(command, args, env) {
    // TODO: Implement
    throw new Error("Not yet implemented");
}
/**
 * Create an SSE-based MCP client
 *
 * @param url - SSE endpoint URL (e.g., "http://localhost:3000/sse")
 * @param headers - Optional HTTP headers
 */
export function createSseClient(url, headers) {
    // TODO: Implement
    throw new Error("Not yet implemented");
}
/**
 * Create an HTTP-based MCP client
 *
 * @param url - JSON-RPC endpoint URL
 * @param headers - Optional HTTP headers
 */
export function createHttpClient(url, headers) {
    // TODO: Implement
    throw new Error("Not yet implemented");
}
//# sourceMappingURL=index.js.map