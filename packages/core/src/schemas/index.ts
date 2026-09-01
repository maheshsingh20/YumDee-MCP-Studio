import { z } from "zod";

/**
 * Core schemas for MCP Studio
 * These schemas define the contract for:
 * - MCP session recording (every request/response/notification)
 * - Server information and capabilities
 * - Error handling across transports
 */

// ============================================================================
// MCP Handshake Schemas
// ============================================================================

export const HandshakeRequestSchema = z.object({
  jsonrpc: z.literal("2.0"),
  id: z.number().int(),
  method: z.literal("initialize"),
  params: z.object({
    protocolVersion: z.string(),
    capabilities: z.record(z.unknown()),
    clientInfo: z.object({
      name: z.string(),
      version: z.string(),
    }),
  }),
});

export const HandshakeResponseSchema = z.object({
  jsonrpc: z.literal("2.0"),
  id: z.number().int(),
  result: z.object({
    protocolVersion: z.string(),
    capabilities: z.record(z.unknown()),
    serverInfo: z.object({
      name: z.string(),
      version: z.string(),
    }),
  }),
});

export type HandshakeRequest = z.infer<typeof HandshakeRequestSchema>;
export type HandshakeResponse = z.infer<typeof HandshakeResponseSchema>;

// ============================================================================
// Event Schemas (what gets recorded in a session)
// ============================================================================

export const McpRequestEventSchema = z.object({
  type: z.literal("request"),
  timestamp: z.string().datetime(),
  id: z.number().int(),
  method: z.string(),
  params: z.unknown().optional(),
  sentAtMs: z.number(), // milliseconds since session start
});

export const McpResponseEventSchema = z.object({
  type: z.literal("response"),
  timestamp: z.string().datetime(),
  id: z.number().int(),
  result: z.unknown().optional(),
  error: z
    .object({
      code: z.number(),
      message: z.string(),
      data: z.unknown().optional(),
    })
    .optional(),
  receivedAtMs: z.number(),
  latencyMs: z.number(), // response.receivedAtMs - request.sentAtMs
});

export const McpNotificationEventSchema = z.object({
  type: z.literal("notification"),
  timestamp: z.string().datetime(),
  method: z.string(),
  params: z.unknown().optional(),
  sentAtMs: z.number(),
  direction: z.enum(["client->server", "server->client"]),
});

export const ErrorEventSchema = z.object({
  type: z.literal("error"),
  timestamp: z.string().datetime(),
  code: z.string(), // e.g., "TRANSPORT_FAILED", "PARSE_ERROR"
  message: z.string(),
  payload: z.unknown().optional(),
});

export type McpRequestEvent = z.infer<typeof McpRequestEventSchema>;
export type McpResponseEvent = z.infer<typeof McpResponseEventSchema>;
export type McpNotificationEvent = z.infer<typeof McpNotificationEventSchema>;
export type ErrorEvent = z.infer<typeof ErrorEventSchema>;

export const McpEventSchema = z.union([
  McpRequestEventSchema,
  McpResponseEventSchema,
  McpNotificationEventSchema,
  ErrorEventSchema,
]);

export type McpEvent = z.infer<typeof McpEventSchema>;

// ============================================================================
// Server Info Schemas
// ============================================================================

export const ServerInfoSchema = z.object({
  name: z.string(),
  version: z.string(),
  transport: z.enum(["stdio", "sse", "http"]),
  endpoint: z.string().optional(), // for SSE/HTTP
  command: z.string().optional(), // for stdio
});

export type ServerInfo = z.infer<typeof ServerInfoSchema>;

// ============================================================================
// Tool, Resource, Prompt Definitions
// ============================================================================

export const ToolDefinitionSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  inputSchema: z.record(z.unknown()).optional(),
});

export const ResourceDefinitionSchema = z.object({
  uri: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  mimeType: z.string().optional(),
});

export const PromptDefinitionSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  arguments: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        required: z.boolean().optional(),
      })
    )
    .optional(),
});

export type ToolDefinition = z.infer<typeof ToolDefinitionSchema>;
export type ResourceDefinition = z.infer<typeof ResourceDefinitionSchema>;
export type PromptDefinition = z.infer<typeof PromptDefinitionSchema>;

// ============================================================================
// Session Schema (the core data structure)
// ============================================================================

export const McpSessionSchema = z.object({
  id: z.string().uuid(),
  serverInfo: ServerInfoSchema,
  clientInfo: z.object({
    name: z.literal("yumdee-mcp-studio"),
    version: z.string(),
  }),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().optional(),
  events: z.array(McpEventSchema),
  metadata: z
    .object({
      tags: z.array(z.string()).optional(),
      notes: z.string().optional(),
    })
    .optional(),
});

export type McpSession = z.infer<typeof McpSessionSchema>;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Parse and validate a session from unknown data
 */
export function parseSession(data: unknown): McpSession {
  return McpSessionSchema.parse(data);
}

/**
 * Parse and validate an event from unknown data
 */
export function parseEvent(data: unknown): McpEvent {
  return McpEventSchema.parse(data);
}
