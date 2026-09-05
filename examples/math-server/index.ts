/**
 * Example MCP Server: Math Calculator
 *
 * A simple stdio-based MCP server that exposes basic math operations.
 * Used for testing the inspector and agent-kit.
 *
 * Usage: node dist/index.js
 */

import { randomUUID } from "crypto";
import { once } from "events";
import { stdin, stdout } from "process";

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: unknown;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
  };
}

// Available tools
const TOOLS = [
  {
    name: "add",
    description: "Add two numbers",
    inputSchema: {
      type: "object",
      properties: {
        a: { type: "number" },
        b: { type: "number" },
      },
      required: ["a", "b"],
    },
  },
  {
    name: "subtract",
    description: "Subtract two numbers",
    inputSchema: {
      type: "object",
      properties: {
        a: { type: "number" },
        b: { type: "number" },
      },
      required: ["a", "b"],
    },
  },
  {
    name: "multiply",
    description: "Multiply two numbers",
    inputSchema: {
      type: "object",
      properties: {
        a: { type: "number" },
        b: { type: "number" },
      },
      required: ["a", "b"],
    },
  },
  {
    name: "divide",
    description: "Divide two numbers",
    inputSchema: {
      type: "object",
      properties: {
        a: { type: "number" },
        b: { type: "number" },
      },
      required: ["a", "b"],
    },
  },
];

function handleInitialize(request: JsonRpcRequest): JsonRpcResponse {
  return {
    jsonrpc: "2.0",
    id: request.id,
    result: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      serverInfo: {
        name: "math-server",
        version: "0.1.0",
      },
    },
  };
}

function handleListTools(request: JsonRpcRequest): JsonRpcResponse {
  return {
    jsonrpc: "2.0",
    id: request.id,
    result: {
      tools: TOOLS,
    },
  };
}

function handleToolCall(request: JsonRpcRequest): JsonRpcResponse {
  const params = (request.params || {}) as any;
  let toolName = request.method.startsWith("tools/call/")
    ? request.method.split("/").pop()
    : params.name;
  const args = params.arguments || params;
  const { a, b } = args;

  let result: number;

  switch (toolName) {
    case "add":
      result = a + b;
      break;
    case "subtract":
      result = a - b;
      break;
    case "multiply":
      result = a * b;
      break;
    case "divide":
      if (b === 0) {
        return {
          jsonrpc: "2.0",
          id: request.id,
          error: {
            code: -32600,
            message: "Cannot divide by zero",
          },
        };
      }
      result = a / b;
      break;
    default:
      return {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: -32601,
          message: `Method or tool not found: ${toolName}`,
        },
      };
  }

  return {
    jsonrpc: "2.0",
    id: request.id,
    result: {
      content: [
        {
          type: "text",
          text: `${a} ${toolName === "add" ? "+" : toolName === "subtract" ? "-" : toolName === "multiply" ? "*" : "/"} ${b} = ${result}`,
        },
      ],
    },
  };
}

async function main() {
  const rl = stdin;
  let buffer = "";

  rl.on("data", (data) => {
    buffer += data.toString();
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line) continue;

      try {
        const request = JSON.parse(line) as JsonRpcRequest;
        let response: JsonRpcResponse;

        if (request.method === "initialize") {
          response = handleInitialize(request);
        } else if (request.method === "tools/list") {
          response = handleListTools(request);
        } else if (request.method === "tools/call" || request.method.startsWith("tools/call/")) {
          response = handleToolCall(request);
        } else if (request.method === "notifications/initialized") {
          // Notification, do not respond
          continue;
        } else {
          response = {
            jsonrpc: "2.0",
            id: request.id,
            error: {
              code: -32601,
              message: "Method not found",
            },
          };
        }

        stdout.write(JSON.stringify(response) + "\n");
      } catch (err) {
        stdout.write(
          JSON.stringify({
            jsonrpc: "2.0",
            id: null,
            error: {
              code: -32700,
              message: "Parse error",
            },
          }) + "\n"
        );
      }
    }
  });

  rl.on("end", () => {
    process.exit(0);
  });
}

main();
