/**
 * MCP Studio Inspector - Web UI & API Server
 *
 * Runs a local HTTP server with REST APIs and SSE streaming for live server inspection,
 * tool invocation, session recording, and session replay.
 */

import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  McpClient,
  SessionStorage,
  McpSession,
  McpEvent,
  createStdioClient,
  createHttpClient,
  createJsonStorage,
} from "@yumdee/mcp-studio-core";
import {
  diagnoseToolFailure,
  DiagnosticRequest,
  DiagnosticResult,
  DiagnosticCategory,
} from "./diagnostics.js";

export {
  diagnoseToolFailure,
  DiagnosticRequest,
  DiagnosticResult,
  DiagnosticCategory,
};

export interface InspectorConfig {
  port: number;
  host?: string;
  storage?: SessionStorage;
  staticDir?: string;
}

export class Inspector {
  private port: number;
  private host: string;
  private storage: SessionStorage;
  private staticDir?: string;
  private server?: http.Server;
  private activeClients: Map<string, McpClient> = new Map();
  private sseClients: Set<http.ServerResponse> = new Set();

  constructor(config: InspectorConfig) {
    this.port = config.port;
    this.host = config.host || "localhost";
    this.storage = config.storage || createJsonStorage();
    this.staticDir = config.staticDir;
  }

  private setCorsHeaders(res: http.ServerResponse) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }

  private sendJson(res: http.ServerResponse, status: number, data: unknown) {
    this.setCorsHeaders(res);
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  }

  private broadcastEvent(event: McpEvent, sessionId: string) {
    const payload = `data: ${JSON.stringify({ sessionId, event })}\n\n`;
    for (const client of this.sseClients) {
      try {
        client.write(payload);
      } catch {
        this.sseClients.delete(client);
      }
    }
  }

  private async parseBody(req: http.IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch (err) {
          reject(new Error("Invalid JSON body"));
        }
      });
      req.on("error", reject);
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = http.createServer(async (req, res) => {
        this.setCorsHeaders(res);

        if (req.method === "OPTIONS") {
          res.writeHead(204);
          res.end();
          return;
        }

        const url = new URL(req.url || "/", `http://${this.host}:${this.port}`);
        const pathname = url.pathname;

        try {
          // SSE Live Event Stream
          if (pathname === "/api/events/stream") {
            res.writeHead(200, {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              Connection: "keep-alive",
            });
            res.write(`data: {"type":"connected"}\n\n`);
            this.sseClients.add(res);

            req.on("close", () => {
              this.sseClients.delete(res);
            });
            return;
          }

          // POST /api/servers/connect
          if (pathname === "/api/servers/connect" && req.method === "POST") {
            const body = await this.parseBody(req);
            const { transport, command, args, url: remoteUrl, env } = body;

            let client: McpClient;
            if (transport === "http" || transport === "sse") {
              client = createHttpClient(remoteUrl);
            } else {
              client = createStdioClient(command, args || [], env);
            }

            // Hook into notifications and events
            client.onNotification((method, params) => {
              const session = client.getSession();
              const latestEvent = session.events[session.events.length - 1];
              if (latestEvent) {
                this.broadcastEvent(latestEvent, session.id);
              }
            });

            const serverInfo = await client.connect();
            const session = client.getSession();
            const sessionId = session.id;

            this.activeClients.set(sessionId, client);

            const tools = client.getTools();
            const resources = client.getResources();
            const prompts = client.getPrompts();

            return this.sendJson(res, 200, {
              sessionId,
              serverInfo,
              tools,
              resources,
              prompts,
              session,
            });
          }

          // POST /api/servers/:id/disconnect
          const disconnectMatch = pathname.match(/^\/api\/servers\/([^/]+)\/disconnect$/);
          if (disconnectMatch && req.method === "POST") {
            const sessionId = disconnectMatch[1];
            const client = this.activeClients.get(sessionId);
            if (client) {
              await client.disconnect();
              this.activeClients.delete(sessionId);
            }
            return this.sendJson(res, 200, { success: true });
          }

          // GET /api/servers/:id/tools
          const toolsMatch = pathname.match(/^\/api\/servers\/([^/]+)\/tools$/);
          if (toolsMatch && req.method === "GET") {
            const sessionId = toolsMatch[1];
            const client = this.activeClients.get(sessionId);
            if (!client) return this.sendJson(res, 404, { error: "Session not found" });
            return this.sendJson(res, 200, { tools: client.getTools() });
          }

          // POST /api/servers/:id/invoke
          const invokeMatch = pathname.match(/^\/api\/servers\/([^/]+)\/invoke$/);
          if (invokeMatch && req.method === "POST") {
            const sessionId = invokeMatch[1];
            const client = this.activeClients.get(sessionId);
            if (!client) return this.sendJson(res, 404, { error: "Session not found" });

            const body = await this.parseBody(req);
            const { toolName, args } = body;

            const startTime = Date.now();
            let result: any;
            let error: any;

            try {
              result = await client.call("tools/call", {
                name: toolName,
                arguments: args || {},
              });
            } catch (err: any) {
              error = err.message || String(err);
            }

            const latencyMs = Date.now() - startTime;
            const session = client.getSession();
            const latestEvent = session.events[session.events.length - 1];
            if (latestEvent) {
              this.broadcastEvent(latestEvent, sessionId);
            }

            return this.sendJson(res, 200, {
              success: !error,
              result,
              error,
              latencyMs,
              session,
            });
          }

          // GET /api/servers/:id/session
          const sessionMatch = pathname.match(/^\/api\/servers\/([^/]+)\/session$/);
          if (sessionMatch && req.method === "GET") {
            const sessionId = sessionMatch[1];
            const client = this.activeClients.get(sessionId);
            if (!client) return this.sendJson(res, 404, { error: "Session not found" });
            return this.sendJson(res, 200, client.getSession());
          }

          // POST /api/sessions/save
          if (pathname === "/api/sessions/save" && req.method === "POST") {
            const body = await this.parseBody(req);
            const { sessionId } = body;
            const client = this.activeClients.get(sessionId);
            if (!client) return this.sendJson(res, 404, { error: "Session not found" });

            const session = client.getSession();
            const savedId = await this.storage.save(session);
            return this.sendJson(res, 200, { success: true, savedId });
          }

          // GET /api/sessions
          if (pathname === "/api/sessions" && req.method === "GET") {
            const sessions = await this.storage.list();
            return this.sendJson(res, 200, { sessions });
          }

          // GET /api/sessions/:id
          const loadMatch = pathname.match(/^\/api\/sessions\/([^/]+)$/);
          if (loadMatch && req.method === "GET") {
            const id = loadMatch[1];
            const session = await this.storage.load(id);
            return this.sendJson(res, 200, session);
          }

          // POST /api/sessions/:id/replay
          const replayMatch = pathname.match(/^\/api\/sessions\/([^/]+)\/replay$/);
          if (replayMatch && req.method === "POST") {
            const id = replayMatch[1];
            const body = await this.parseBody(req);
            const targetSessionId = body.targetSessionId;
            const targetClient = this.activeClients.get(targetSessionId);
            if (!targetClient) {
              return this.sendJson(res, 400, { error: "No active connected server to replay against" });
            }

            const originalSession = await this.storage.load(id);
            const toolCallRequests = originalSession.events.filter(
              (e: any) => e.type === "request" && (e.method === "tools/call" || e.method?.startsWith("tools/call/"))
            );

            const replayResults = [];
            for (const reqEvent of toolCallRequests) {
              const req: any = reqEvent;
              const params: any = req.params || {};
              const toolName = req.method?.startsWith("tools/call/")
                ? req.method.split("/").pop()
                : params.name;
              const args = params.arguments || params;

              const originalResponse = originalSession.events.find(
                (e) => e.type === "response" && e.id === req.id
              );

              const startMs = Date.now();
              let newResult: any;
              let newError: any;
              try {
                newResult = await targetClient.call("tools/call", {
                  name: toolName,
                  arguments: args,
                });
              } catch (err: any) {
                newError = err.message || String(err);
              }
              const replayedLatencyMs = Date.now() - startMs;

              replayResults.push({
                toolName,
                args,
                originalResponse: originalResponse ? (originalResponse as any).result : null,
                originalLatencyMs: originalResponse ? (originalResponse as any).latencyMs : 0,
                replayedResponse: newResult,
                replayedError: newError,
                replayedLatencyMs,
                matched: JSON.stringify(originalResponse ? (originalResponse as any).result : null) === JSON.stringify(newResult),
              });
            }

            return this.sendJson(res, 200, {
              success: true,
              totalCalls: toolCallRequests.length,
              replays: replayResults,
            });
          }

          // POST /api/diagnose - AI Root Cause Diagnostic & Auto-Fix Copilot
          if (pathname === "/api/diagnose" && req.method === "POST") {
            const body = await this.parseBody(req);
            const diagnostic = diagnoseToolFailure(body);
            return this.sendJson(res, 200, {
              success: true,
              ...diagnostic,
            });
          }

          // Static UI Serving fallback
          if (this.staticDir && fs.existsSync(this.staticDir)) {
            let filePath = path.join(this.staticDir, pathname === "/" ? "index.html" : pathname);
            if (!fs.existsSync(filePath)) {
              filePath = path.join(this.staticDir, "index.html");
            }
            const ext = path.extname(filePath);
            const contentTypes: Record<string, string> = {
              ".html": "text/html",
              ".js": "application/javascript",
              ".css": "text/css",
              ".json": "application/json",
              ".svg": "image/svg+xml",
              ".png": "image/png",
            };
            const contentType = contentTypes[ext] || "text/plain";
            const content = fs.readFileSync(filePath);
            res.writeHead(200, { "Content-Type": contentType });
            res.end(content);
            return;
          }

          // Health / fallback
          return this.sendJson(res, 200, {
            name: "yumdee-mcp-studio-inspector",
            status: "running",
            version: "0.1.0",
          });
        } catch (err: any) {
          console.error("Inspector API Error:", err);
          return this.sendJson(res, 500, { error: err.message || "Internal Server Error" });
        }
      });

      this.server.listen(this.port, this.host, () => {
        console.log(`⚡ MCP Studio Inspector server running at http://${this.host}:${this.port}`);
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    for (const client of this.activeClients.values()) {
      await client.disconnect().catch(() => {});
    }
    this.activeClients.clear();

    for (const res of this.sseClients) {
      res.end();
    }
    this.sseClients.clear();

    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }
}

export function createInspector(config: InspectorConfig): Inspector {
  return new Inspector(config);
}
