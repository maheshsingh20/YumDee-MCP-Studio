/**
 * MCP Client Implementation
 *
 * Abstract interface and concrete implementations for MCP clients.
 * Handles the JSON-RPC protocol, lifecycle, and session recording.
 */

import fs from "fs";
import * as path from "path";
import { spawn, ChildProcess } from "child_process";
import { randomUUID } from "crypto";

function resolveArgPath(arg: string): string {
  if (arg.endsWith(".js") || arg.endsWith(".ts") || arg.endsWith(".json")) {
    if (fs.existsSync(arg)) return arg;
    const cleaned = arg.replace(/^(\.\.[\/\\])+/, "");
    if (fs.existsSync(cleaned)) return path.resolve(cleaned);
    const fromCwd = path.resolve(process.cwd(), cleaned);
    if (fs.existsSync(fromCwd)) return fromCwd;
    // Check inside packages or root
    const fromParent = path.resolve(process.cwd(), "..", cleaned);
    if (fs.existsSync(fromParent)) return fromParent;
  }
  return arg;
}
import {
  McpSession,
  McpEvent,
  ServerInfo,
  ToolDefinition,
  ResourceDefinition,
  PromptDefinition,
  McpRequestEvent,
  McpResponseEvent,
  McpNotificationEvent,
  ErrorEvent,
} from "../schemas/index.js";

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
  getTools(): ToolDefinition[];
  getResources(): ResourceDefinition[];
  getPrompts(): PromptDefinition[];

  // Session recording (auto-recorded for every call/notify/notification)
  getSession(): McpSession;
  getEvents(): McpEvent[];
  clearSession(): void;
}

// ============================================================================
// Stdio Implementation
// ============================================================================

export class StdioMcpClient implements McpClient {
  private command: string;
  private args: string[];
  private env?: Record<string, string>;
  private process?: ChildProcess;
  private connected: boolean = false;
  private nextId: number = 1;
  private startTimeMs: number = 0;
  private sessionId: string = randomUUID();
  private startedAt: string = new Date().toISOString();
  private endedAt?: string;
  private events: McpEvent[] = [];
  private serverInfo: ServerInfo = {
    name: "unknown",
    version: "0.0.0",
    transport: "stdio",
  };
  private capabilities: Record<string, unknown> = {};
  private tools: ToolDefinition[] = [];
  private resources: ResourceDefinition[] = [];
  private prompts: PromptDefinition[] = [];
  private notificationListeners: Set<(method: string, params: unknown) => void> = new Set();
  private pendingRequests: Map<
    number,
    {
      sentAtMs: number;
      method: string;
      resolve: (value: any) => void;
      reject: (reason: any) => void;
    }
  > = new Map();
  private buffer: string = "";

  constructor(command: string, args: string[] = [], env?: Record<string, string>) {
    this.command = command;
    this.args = args;
    this.env = env;
  }

  async connect(): Promise<ServerInfo> {
    if (this.connected) return this.serverInfo;

    this.sessionId = randomUUID();
    this.startedAt = new Date().toISOString();
    this.startTimeMs = Date.now();
    this.events = [];
    this.endedAt = undefined;

    // Split command if args were embedded
    let cmd = this.command;
    let cmdArgs = [...this.args];
    if (cmdArgs.length === 0 && cmd.includes(" ")) {
      const parts = cmd.split(" ");
      cmd = parts[0];
      cmdArgs = parts.slice(1);
    }
    cmdArgs = cmdArgs.map(resolveArgPath);

    return new Promise((resolve, reject) => {
      try {
        let lastStderrText = "";
        const isWindows = process.platform === "win32";
        this.process = spawn(cmd, cmdArgs, {
          env: { ...process.env, ...this.env },
          shell: isWindows,
          stdio: ["pipe", "pipe", "pipe"],
        });

        this.process.stdout?.on("data", (data: Buffer) => {
          this.handleStdout(data.toString());
        });

        this.process.stderr?.on("data", (data: Buffer) => {
          const text = data.toString().trim();
          if (text) {
            lastStderrText = text;
            const errEvent: ErrorEvent = {
              type: "error",
              timestamp: new Date().toISOString(),
              code: "STDERR",
              message: text,
            };
            this.events.push(errEvent);
          }
        });

        this.process.on("error", (err) => {
          const errEvent: ErrorEvent = {
            type: "error",
            timestamp: new Date().toISOString(),
            code: "PROCESS_ERROR",
            message: err.message,
          };
          this.events.push(errEvent);
          if (!this.connected) {
            reject(err);
          }
        });

        this.process.on("close", (code) => {
          this.connected = false;
          this.endedAt = new Date().toISOString();
          const detail = lastStderrText ? `: ${lastStderrText}` : "";
          for (const [id, req] of this.pendingRequests.entries()) {
            req.reject(new Error(`Process terminated with code ${code}${detail}`));
            this.pendingRequests.delete(id);
          }
          if (!this.connected) {
            reject(new Error(`Process terminated with code ${code}${detail}`));
          }
        });

        // Perform handshake
        this.performHandshake()
          .then((info) => {
            this.connected = true;
            resolve(info);
          })
          .catch((err) => {
            this.disconnect().finally(() => reject(err));
          });
      } catch (err) {
        reject(err);
      }
    });
  }

  private async performHandshake(): Promise<ServerInfo> {
    const handshakeResult: any = await this.call("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "yumdee-mcp-studio",
        version: "0.1.0",
      },
    });

    const sInfo = handshakeResult?.serverInfo || { name: "unknown", version: "0.1.0" };
    this.serverInfo = {
      name: sInfo.name,
      version: sInfo.version,
      transport: "stdio",
      command: `${this.command} ${this.args.join(" ")}`.trim(),
    };
    this.capabilities = handshakeResult?.capabilities || {};

    // Send initialized notification as per MCP spec
    await this.notify("notifications/initialized", {});

    // Introspect tools, resources, prompts
    try {
      const toolsRes: any = await this.call("tools/list", {});
      if (toolsRes && Array.isArray(toolsRes.tools)) {
        this.tools = toolsRes.tools;
      }
    } catch {
      // Server may not support tools/list
    }

    try {
      const resRes: any = await this.call("resources/list", {});
      if (resRes && Array.isArray(resRes.resources)) {
        this.resources = resRes.resources;
      }
    } catch {
      // Server may not support resources/list
    }

    try {
      const promptsRes: any = await this.call("prompts/list", {});
      if (promptsRes && Array.isArray(promptsRes.prompts)) {
        this.prompts = promptsRes.prompts;
      }
    } catch {
      // Server may not support prompts/list
    }

    return this.serverInfo;
  }

  private handleStdout(data: string) {
    this.buffer += data;
    const lines = this.buffer.split("\n");
    this.buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const msg = JSON.parse(trimmed);
        const receivedAtMs = Date.now() - this.startTimeMs;

        // Is it a response?
        if (msg.id !== undefined && (msg.result !== undefined || msg.error !== undefined)) {
          const req = this.pendingRequests.get(Number(msg.id));
          const sentAtMs = req ? req.sentAtMs : receivedAtMs;
          const latencyMs = Math.max(0, receivedAtMs - sentAtMs);

          const responseEvent: McpResponseEvent = {
            type: "response",
            timestamp: new Date().toISOString(),
            id: Number(msg.id),
            result: msg.result,
            error: msg.error,
            receivedAtMs,
            latencyMs,
          };
          this.events.push(responseEvent);

          if (req) {
            this.pendingRequests.delete(Number(msg.id));
            if (msg.error) {
              req.reject(new Error(msg.error.message || `RPC Error ${msg.error.code}`));
            } else {
              req.resolve(msg.result);
            }
          }
        } else if (msg.method) {
          // Server-to-client notification or request
          const notifEvent: McpNotificationEvent = {
            type: "notification",
            timestamp: new Date().toISOString(),
            method: msg.method,
            params: msg.params,
            sentAtMs: receivedAtMs,
            direction: "server->client",
          };
          this.events.push(notifEvent);

          for (const listener of this.notificationListeners) {
            try {
              listener(msg.method, msg.params);
            } catch (err) {
              console.error("Error in notification listener:", err);
            }
          }
        }
      } catch (err) {
        const errEvent: ErrorEvent = {
          type: "error",
          timestamp: new Date().toISOString(),
          code: "PARSE_ERROR",
          message: `Failed to parse message: ${trimmed}`,
          payload: { raw: trimmed },
        };
        this.events.push(errEvent);
      }
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.endedAt = new Date().toISOString();
    if (this.process) {
      this.process.kill();
      this.process = undefined;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  call<P = unknown, R = unknown>(method: string, params?: P): Promise<R> {
    return new Promise((resolve, reject) => {
      if (!this.process || !this.process.stdin) {
        return reject(new Error("Client is not running"));
      }

      const id = this.nextId++;
      const sentAtMs = Date.now() - this.startTimeMs;

      const reqEvent: McpRequestEvent = {
        type: "request",
        timestamp: new Date().toISOString(),
        id,
        method,
        params,
        sentAtMs,
      };
      this.events.push(reqEvent);

      this.pendingRequests.set(id, {
        sentAtMs,
        method,
        resolve,
        reject,
      });

      const message = {
        jsonrpc: "2.0",
        id,
        method,
        params: params ?? {},
      };

      try {
        this.process.stdin.write(JSON.stringify(message) + "\n");
      } catch (err) {
        this.pendingRequests.delete(id);
        reject(err);
      }
    });
  }

  async notify(method: string, params?: unknown): Promise<void> {
    if (!this.process || !this.process.stdin) {
      throw new Error("Client is not running");
    }

    const sentAtMs = Date.now() - this.startTimeMs;
    const notifEvent: McpNotificationEvent = {
      type: "notification",
      timestamp: new Date().toISOString(),
      method,
      params,
      sentAtMs,
      direction: "client->server",
    };
    this.events.push(notifEvent);

    const message = {
      jsonrpc: "2.0",
      method,
      params: params ?? {},
    };

    this.process.stdin.write(JSON.stringify(message) + "\n");
  }

  onNotification(callback: (method: string, params: unknown) => void): () => void {
    this.notificationListeners.add(callback);
    return () => {
      this.notificationListeners.delete(callback);
    };
  }

  getServerInfo(): ServerInfo {
    return this.serverInfo;
  }

  getCapabilities(): Record<string, unknown> {
    return this.capabilities;
  }

  getTools(): ToolDefinition[] {
    return this.tools;
  }

  getResources(): ResourceDefinition[] {
    return this.resources;
  }

  getPrompts(): PromptDefinition[] {
    return this.prompts;
  }

  getSession(): McpSession {
    return {
      id: this.sessionId,
      serverInfo: this.serverInfo,
      clientInfo: {
        name: "yumdee-mcp-studio",
        version: "0.1.0",
      },
      startedAt: this.startedAt,
      endedAt: this.endedAt,
      events: [...this.events],
    };
  }

  getEvents(): McpEvent[] {
    return [...this.events];
  }

  clearSession(): void {
    this.sessionId = randomUUID();
    this.startedAt = new Date().toISOString();
    this.endedAt = undefined;
    this.events = [];
    this.startTimeMs = Date.now();
  }
}

// ============================================================================
// HTTP / SSE Implementation
// ============================================================================

export class HttpMcpClient implements McpClient {
  private url: string;
  private headers: Record<string, string>;
  private connected: boolean = false;
  private nextId: number = 1;
  private startTimeMs: number = 0;
  private sessionId: string = randomUUID();
  private startedAt: string = new Date().toISOString();
  private endedAt?: string;
  private events: McpEvent[] = [];
  private serverInfo: ServerInfo;
  private capabilities: Record<string, unknown> = {};
  private tools: ToolDefinition[] = [];
  private resources: ResourceDefinition[] = [];
  private prompts: PromptDefinition[] = [];
  private notificationListeners: Set<(method: string, params: unknown) => void> = new Set();

  constructor(url: string, headers?: Record<string, string>, transport: "http" | "sse" = "http") {
    this.url = url;
    this.headers = headers || {};
    this.serverInfo = {
      name: "remote-server",
      version: "0.1.0",
      transport,
      endpoint: url,
    };
  }

  async connect(): Promise<ServerInfo> {
    this.sessionId = randomUUID();
    this.startedAt = new Date().toISOString();
    this.startTimeMs = Date.now();
    this.events = [];
    this.connected = true;

    try {
      const res: any = await this.call("initialize", {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: {
          name: "yumdee-mcp-studio",
          version: "0.1.0",
        },
      });

      if (res?.serverInfo) {
        this.serverInfo = {
          name: res.serverInfo.name,
          version: res.serverInfo.version,
          transport: this.serverInfo.transport,
          endpoint: this.url,
        };
      }
      this.capabilities = res?.capabilities || {};

      await this.notify("notifications/initialized", {});

      try {
        const toolsRes: any = await this.call("tools/list", {});
        if (toolsRes?.tools) this.tools = toolsRes.tools;
      } catch {}

      return this.serverInfo;
    } catch (err: any) {
      this.connected = false;
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.endedAt = new Date().toISOString();
  }

  isConnected(): boolean {
    return this.connected;
  }

  async call<P = unknown, R = unknown>(method: string, params?: P): Promise<R> {
    const id = this.nextId++;
    const sentAtMs = Date.now() - this.startTimeMs;

    this.events.push({
      type: "request",
      timestamp: new Date().toISOString(),
      id,
      method,
      params,
      sentAtMs,
    });

    const payload = {
      jsonrpc: "2.0",
      id,
      method,
      params: params ?? {},
    };

    const res = await fetch(this.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.headers,
      },
      body: JSON.stringify(payload),
    });

    const receivedAtMs = Date.now() - this.startTimeMs;
    const latencyMs = Math.max(0, receivedAtMs - sentAtMs);

    if (!res.ok) {
      const errEvent: ErrorEvent = {
        type: "error",
        timestamp: new Date().toISOString(),
        code: `HTTP_${res.status}`,
        message: `HTTP request failed: ${res.statusText}`,
      };
      this.events.push(errEvent);
      throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
    }

    const data: any = await res.json();
    this.events.push({
      type: "response",
      timestamp: new Date().toISOString(),
      id,
      result: data.result,
      error: data.error,
      receivedAtMs,
      latencyMs,
    });

    if (data.error) {
      throw new Error(data.error.message || `RPC Error ${data.error.code}`);
    }

    return data.result;
  }

  async notify(method: string, params?: unknown): Promise<void> {
    const sentAtMs = Date.now() - this.startTimeMs;
    this.events.push({
      type: "notification",
      timestamp: new Date().toISOString(),
      method,
      params,
      sentAtMs,
      direction: "client->server",
    });

    await fetch(this.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.headers,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method,
        params: params ?? {},
      }),
    });
  }

  onNotification(callback: (method: string, params: unknown) => void): () => void {
    this.notificationListeners.add(callback);
    return () => {
      this.notificationListeners.delete(callback);
    };
  }

  getServerInfo(): ServerInfo {
    return this.serverInfo;
  }

  getCapabilities(): Record<string, unknown> {
    return this.capabilities;
  }

  getTools(): ToolDefinition[] {
    return this.tools;
  }

  getResources(): ResourceDefinition[] {
    return this.resources;
  }

  getPrompts(): PromptDefinition[] {
    return this.prompts;
  }

  getSession(): McpSession {
    return {
      id: this.sessionId,
      serverInfo: this.serverInfo,
      clientInfo: {
        name: "yumdee-mcp-studio",
        version: "0.1.0",
      },
      startedAt: this.startedAt,
      endedAt: this.endedAt,
      events: [...this.events],
    };
  }

  getEvents(): McpEvent[] {
    return [...this.events];
  }

  clearSession(): void {
    this.sessionId = randomUUID();
    this.startedAt = new Date().toISOString();
    this.endedAt = undefined;
    this.events = [];
    this.startTimeMs = Date.now();
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

export function createStdioClient(
  command: string,
  args?: string[],
  env?: Record<string, string>
): McpClient {
  return new StdioMcpClient(command, args, env);
}

export function createSseClient(
  url: string,
  headers?: Record<string, string>
): McpClient {
  return new HttpMcpClient(url, headers, "sse");
}

export function createHttpClient(
  url: string,
  headers?: Record<string, string>
): McpClient {
  return new HttpMcpClient(url, headers, "http");
}
