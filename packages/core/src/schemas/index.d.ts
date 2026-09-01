import { z } from "zod";
/**
 * Core schemas for MCP Studio
 * These schemas define the contract for:
 * - MCP session recording (every request/response/notification)
 * - Server information and capabilities
 * - Error handling across transports
 */
export declare const HandshakeRequestSchema: z.ZodObject<{
    jsonrpc: z.ZodLiteral<"2.0">;
    id: z.ZodNumber;
    method: z.ZodLiteral<"initialize">;
    params: z.ZodObject<{
        protocolVersion: z.ZodString;
        capabilities: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        clientInfo: z.ZodObject<{
            name: z.ZodString;
            version: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
            version: string;
        }, {
            name: string;
            version: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        protocolVersion: string;
        capabilities: Record<string, unknown>;
        clientInfo: {
            name: string;
            version: string;
        };
    }, {
        protocolVersion: string;
        capabilities: Record<string, unknown>;
        clientInfo: {
            name: string;
            version: string;
        };
    }>;
}, "strip", z.ZodTypeAny, {
    jsonrpc: "2.0";
    params: {
        protocolVersion: string;
        capabilities: Record<string, unknown>;
        clientInfo: {
            name: string;
            version: string;
        };
    };
    id: number;
    method: "initialize";
}, {
    jsonrpc: "2.0";
    params: {
        protocolVersion: string;
        capabilities: Record<string, unknown>;
        clientInfo: {
            name: string;
            version: string;
        };
    };
    id: number;
    method: "initialize";
}>;
export declare const HandshakeResponseSchema: z.ZodObject<{
    jsonrpc: z.ZodLiteral<"2.0">;
    id: z.ZodNumber;
    result: z.ZodObject<{
        protocolVersion: z.ZodString;
        capabilities: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        serverInfo: z.ZodObject<{
            name: z.ZodString;
            version: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
            version: string;
        }, {
            name: string;
            version: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        protocolVersion: string;
        capabilities: Record<string, unknown>;
        serverInfo: {
            name: string;
            version: string;
        };
    }, {
        protocolVersion: string;
        capabilities: Record<string, unknown>;
        serverInfo: {
            name: string;
            version: string;
        };
    }>;
}, "strip", z.ZodTypeAny, {
    jsonrpc: "2.0";
    id: number;
    result: {
        protocolVersion: string;
        capabilities: Record<string, unknown>;
        serverInfo: {
            name: string;
            version: string;
        };
    };
}, {
    jsonrpc: "2.0";
    id: number;
    result: {
        protocolVersion: string;
        capabilities: Record<string, unknown>;
        serverInfo: {
            name: string;
            version: string;
        };
    };
}>;
export type HandshakeRequest = z.infer<typeof HandshakeRequestSchema>;
export type HandshakeResponse = z.infer<typeof HandshakeResponseSchema>;
export declare const McpRequestEventSchema: z.ZodObject<{
    type: z.ZodLiteral<"request">;
    timestamp: z.ZodString;
    id: z.ZodNumber;
    method: z.ZodString;
    params: z.ZodOptional<z.ZodUnknown>;
    sentAtMs: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "request";
    id: number;
    method: string;
    timestamp: string;
    sentAtMs: number;
    params?: unknown;
}, {
    type: "request";
    id: number;
    method: string;
    timestamp: string;
    sentAtMs: number;
    params?: unknown;
}>;
export declare const McpResponseEventSchema: z.ZodObject<{
    type: z.ZodLiteral<"response">;
    timestamp: z.ZodString;
    id: z.ZodNumber;
    result: z.ZodOptional<z.ZodUnknown>;
    error: z.ZodOptional<z.ZodObject<{
        code: z.ZodNumber;
        message: z.ZodString;
        data: z.ZodOptional<z.ZodUnknown>;
    }, "strip", z.ZodTypeAny, {
        code: number;
        message: string;
        data?: unknown;
    }, {
        code: number;
        message: string;
        data?: unknown;
    }>>;
    receivedAtMs: z.ZodNumber;
    latencyMs: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "response";
    id: number;
    timestamp: string;
    receivedAtMs: number;
    latencyMs: number;
    result?: unknown;
    error?: {
        code: number;
        message: string;
        data?: unknown;
    } | undefined;
}, {
    type: "response";
    id: number;
    timestamp: string;
    receivedAtMs: number;
    latencyMs: number;
    result?: unknown;
    error?: {
        code: number;
        message: string;
        data?: unknown;
    } | undefined;
}>;
export declare const McpNotificationEventSchema: z.ZodObject<{
    type: z.ZodLiteral<"notification">;
    timestamp: z.ZodString;
    method: z.ZodString;
    params: z.ZodOptional<z.ZodUnknown>;
    sentAtMs: z.ZodNumber;
    direction: z.ZodEnum<["client->server", "server->client"]>;
}, "strip", z.ZodTypeAny, {
    type: "notification";
    method: string;
    timestamp: string;
    sentAtMs: number;
    direction: "client->server" | "server->client";
    params?: unknown;
}, {
    type: "notification";
    method: string;
    timestamp: string;
    sentAtMs: number;
    direction: "client->server" | "server->client";
    params?: unknown;
}>;
export declare const ErrorEventSchema: z.ZodObject<{
    type: z.ZodLiteral<"error">;
    timestamp: z.ZodString;
    code: z.ZodString;
    message: z.ZodString;
    payload: z.ZodOptional<z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    code: string;
    message: string;
    type: "error";
    timestamp: string;
    payload?: unknown;
}, {
    code: string;
    message: string;
    type: "error";
    timestamp: string;
    payload?: unknown;
}>;
export type McpRequestEvent = z.infer<typeof McpRequestEventSchema>;
export type McpResponseEvent = z.infer<typeof McpResponseEventSchema>;
export type McpNotificationEvent = z.infer<typeof McpNotificationEventSchema>;
export type ErrorEvent = z.infer<typeof ErrorEventSchema>;
export declare const McpEventSchema: z.ZodUnion<[z.ZodObject<{
    type: z.ZodLiteral<"request">;
    timestamp: z.ZodString;
    id: z.ZodNumber;
    method: z.ZodString;
    params: z.ZodOptional<z.ZodUnknown>;
    sentAtMs: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "request";
    id: number;
    method: string;
    timestamp: string;
    sentAtMs: number;
    params?: unknown;
}, {
    type: "request";
    id: number;
    method: string;
    timestamp: string;
    sentAtMs: number;
    params?: unknown;
}>, z.ZodObject<{
    type: z.ZodLiteral<"response">;
    timestamp: z.ZodString;
    id: z.ZodNumber;
    result: z.ZodOptional<z.ZodUnknown>;
    error: z.ZodOptional<z.ZodObject<{
        code: z.ZodNumber;
        message: z.ZodString;
        data: z.ZodOptional<z.ZodUnknown>;
    }, "strip", z.ZodTypeAny, {
        code: number;
        message: string;
        data?: unknown;
    }, {
        code: number;
        message: string;
        data?: unknown;
    }>>;
    receivedAtMs: z.ZodNumber;
    latencyMs: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "response";
    id: number;
    timestamp: string;
    receivedAtMs: number;
    latencyMs: number;
    result?: unknown;
    error?: {
        code: number;
        message: string;
        data?: unknown;
    } | undefined;
}, {
    type: "response";
    id: number;
    timestamp: string;
    receivedAtMs: number;
    latencyMs: number;
    result?: unknown;
    error?: {
        code: number;
        message: string;
        data?: unknown;
    } | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<"notification">;
    timestamp: z.ZodString;
    method: z.ZodString;
    params: z.ZodOptional<z.ZodUnknown>;
    sentAtMs: z.ZodNumber;
    direction: z.ZodEnum<["client->server", "server->client"]>;
}, "strip", z.ZodTypeAny, {
    type: "notification";
    method: string;
    timestamp: string;
    sentAtMs: number;
    direction: "client->server" | "server->client";
    params?: unknown;
}, {
    type: "notification";
    method: string;
    timestamp: string;
    sentAtMs: number;
    direction: "client->server" | "server->client";
    params?: unknown;
}>, z.ZodObject<{
    type: z.ZodLiteral<"error">;
    timestamp: z.ZodString;
    code: z.ZodString;
    message: z.ZodString;
    payload: z.ZodOptional<z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    code: string;
    message: string;
    type: "error";
    timestamp: string;
    payload?: unknown;
}, {
    code: string;
    message: string;
    type: "error";
    timestamp: string;
    payload?: unknown;
}>]>;
export type McpEvent = z.infer<typeof McpEventSchema>;
export declare const ServerInfoSchema: z.ZodObject<{
    name: z.ZodString;
    version: z.ZodString;
    transport: z.ZodEnum<["stdio", "sse", "http"]>;
    endpoint: z.ZodOptional<z.ZodString>;
    command: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    version: string;
    transport: "stdio" | "sse" | "http";
    endpoint?: string | undefined;
    command?: string | undefined;
}, {
    name: string;
    version: string;
    transport: "stdio" | "sse" | "http";
    endpoint?: string | undefined;
    command?: string | undefined;
}>;
export type ServerInfo = z.infer<typeof ServerInfoSchema>;
export declare const ToolDefinitionSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    inputSchema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description?: string | undefined;
    inputSchema?: Record<string, unknown> | undefined;
}, {
    name: string;
    description?: string | undefined;
    inputSchema?: Record<string, unknown> | undefined;
}>;
export declare const ResourceDefinitionSchema: z.ZodObject<{
    uri: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    mimeType: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    uri: string;
    name?: string | undefined;
    description?: string | undefined;
    mimeType?: string | undefined;
}, {
    uri: string;
    name?: string | undefined;
    description?: string | undefined;
    mimeType?: string | undefined;
}>;
export declare const PromptDefinitionSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    arguments: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        required: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        description?: string | undefined;
        required?: boolean | undefined;
    }, {
        name: string;
        description?: string | undefined;
        required?: boolean | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description?: string | undefined;
    arguments?: {
        name: string;
        description?: string | undefined;
        required?: boolean | undefined;
    }[] | undefined;
}, {
    name: string;
    description?: string | undefined;
    arguments?: {
        name: string;
        description?: string | undefined;
        required?: boolean | undefined;
    }[] | undefined;
}>;
export type ToolDefinition = z.infer<typeof ToolDefinitionSchema>;
export type ResourceDefinition = z.infer<typeof ResourceDefinitionSchema>;
export type PromptDefinition = z.infer<typeof PromptDefinitionSchema>;
export declare const McpSessionSchema: z.ZodObject<{
    id: z.ZodString;
    serverInfo: z.ZodObject<{
        name: z.ZodString;
        version: z.ZodString;
        transport: z.ZodEnum<["stdio", "sse", "http"]>;
        endpoint: z.ZodOptional<z.ZodString>;
        command: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        version: string;
        transport: "stdio" | "sse" | "http";
        endpoint?: string | undefined;
        command?: string | undefined;
    }, {
        name: string;
        version: string;
        transport: "stdio" | "sse" | "http";
        endpoint?: string | undefined;
        command?: string | undefined;
    }>;
    clientInfo: z.ZodObject<{
        name: z.ZodLiteral<"yumdee-mcp-studio">;
        version: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: "yumdee-mcp-studio";
        version: string;
    }, {
        name: "yumdee-mcp-studio";
        version: string;
    }>;
    startedAt: z.ZodString;
    endedAt: z.ZodOptional<z.ZodString>;
    events: z.ZodArray<z.ZodUnion<[z.ZodObject<{
        type: z.ZodLiteral<"request">;
        timestamp: z.ZodString;
        id: z.ZodNumber;
        method: z.ZodString;
        params: z.ZodOptional<z.ZodUnknown>;
        sentAtMs: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "request";
        id: number;
        method: string;
        timestamp: string;
        sentAtMs: number;
        params?: unknown;
    }, {
        type: "request";
        id: number;
        method: string;
        timestamp: string;
        sentAtMs: number;
        params?: unknown;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"response">;
        timestamp: z.ZodString;
        id: z.ZodNumber;
        result: z.ZodOptional<z.ZodUnknown>;
        error: z.ZodOptional<z.ZodObject<{
            code: z.ZodNumber;
            message: z.ZodString;
            data: z.ZodOptional<z.ZodUnknown>;
        }, "strip", z.ZodTypeAny, {
            code: number;
            message: string;
            data?: unknown;
        }, {
            code: number;
            message: string;
            data?: unknown;
        }>>;
        receivedAtMs: z.ZodNumber;
        latencyMs: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "response";
        id: number;
        timestamp: string;
        receivedAtMs: number;
        latencyMs: number;
        result?: unknown;
        error?: {
            code: number;
            message: string;
            data?: unknown;
        } | undefined;
    }, {
        type: "response";
        id: number;
        timestamp: string;
        receivedAtMs: number;
        latencyMs: number;
        result?: unknown;
        error?: {
            code: number;
            message: string;
            data?: unknown;
        } | undefined;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"notification">;
        timestamp: z.ZodString;
        method: z.ZodString;
        params: z.ZodOptional<z.ZodUnknown>;
        sentAtMs: z.ZodNumber;
        direction: z.ZodEnum<["client->server", "server->client"]>;
    }, "strip", z.ZodTypeAny, {
        type: "notification";
        method: string;
        timestamp: string;
        sentAtMs: number;
        direction: "client->server" | "server->client";
        params?: unknown;
    }, {
        type: "notification";
        method: string;
        timestamp: string;
        sentAtMs: number;
        direction: "client->server" | "server->client";
        params?: unknown;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"error">;
        timestamp: z.ZodString;
        code: z.ZodString;
        message: z.ZodString;
        payload: z.ZodOptional<z.ZodUnknown>;
    }, "strip", z.ZodTypeAny, {
        code: string;
        message: string;
        type: "error";
        timestamp: string;
        payload?: unknown;
    }, {
        code: string;
        message: string;
        type: "error";
        timestamp: string;
        payload?: unknown;
    }>]>, "many">;
    metadata: z.ZodOptional<z.ZodObject<{
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        tags?: string[] | undefined;
        notes?: string | undefined;
    }, {
        tags?: string[] | undefined;
        notes?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    clientInfo: {
        name: "yumdee-mcp-studio";
        version: string;
    };
    serverInfo: {
        name: string;
        version: string;
        transport: "stdio" | "sse" | "http";
        endpoint?: string | undefined;
        command?: string | undefined;
    };
    startedAt: string;
    events: ({
        type: "request";
        id: number;
        method: string;
        timestamp: string;
        sentAtMs: number;
        params?: unknown;
    } | {
        type: "response";
        id: number;
        timestamp: string;
        receivedAtMs: number;
        latencyMs: number;
        result?: unknown;
        error?: {
            code: number;
            message: string;
            data?: unknown;
        } | undefined;
    } | {
        type: "notification";
        method: string;
        timestamp: string;
        sentAtMs: number;
        direction: "client->server" | "server->client";
        params?: unknown;
    } | {
        code: string;
        message: string;
        type: "error";
        timestamp: string;
        payload?: unknown;
    })[];
    endedAt?: string | undefined;
    metadata?: {
        tags?: string[] | undefined;
        notes?: string | undefined;
    } | undefined;
}, {
    id: string;
    clientInfo: {
        name: "yumdee-mcp-studio";
        version: string;
    };
    serverInfo: {
        name: string;
        version: string;
        transport: "stdio" | "sse" | "http";
        endpoint?: string | undefined;
        command?: string | undefined;
    };
    startedAt: string;
    events: ({
        type: "request";
        id: number;
        method: string;
        timestamp: string;
        sentAtMs: number;
        params?: unknown;
    } | {
        type: "response";
        id: number;
        timestamp: string;
        receivedAtMs: number;
        latencyMs: number;
        result?: unknown;
        error?: {
            code: number;
            message: string;
            data?: unknown;
        } | undefined;
    } | {
        type: "notification";
        method: string;
        timestamp: string;
        sentAtMs: number;
        direction: "client->server" | "server->client";
        params?: unknown;
    } | {
        code: string;
        message: string;
        type: "error";
        timestamp: string;
        payload?: unknown;
    })[];
    endedAt?: string | undefined;
    metadata?: {
        tags?: string[] | undefined;
        notes?: string | undefined;
    } | undefined;
}>;
export type McpSession = z.infer<typeof McpSessionSchema>;
/**
 * Parse and validate a session from unknown data
 */
export declare function parseSession(data: unknown): McpSession;
/**
 * Parse and validate an event from unknown data
 */
export declare function parseEvent(data: unknown): McpEvent;
//# sourceMappingURL=index.d.ts.map