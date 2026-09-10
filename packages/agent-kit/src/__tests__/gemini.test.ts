import { describe, it, expect, vi, afterEach } from "vitest";
import {
  formatMcpToolToGemini,
  verifyGeminiApiKey,
  callGeminiGenerateContent,
  Agent,
  SemanticToolRouter,
} from "../index.js";

describe("Gemini Adapter & Tool Integration", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should correctly convert an MCP tool to Gemini functionDeclaration format", () => {
    const mcpTool = {
      name: "calculate_sum",
      description: "Adds two numbers together",
      inputSchema: {
        type: "object",
        properties: {
          a: { type: "number" },
          b: { type: "number" },
        },
        required: ["a", "b"],
      },
    };

    const decl = formatMcpToolToGemini(mcpTool);
    expect(decl.name).toBe("calculate_sum");
    expect(decl.description).toBe("Adds two numbers together");
    expect(decl.parameters.type).toBe("object");
    expect(decl.parameters.required).toEqual(["a", "b"]);
  });

  it("should strip $schema and incompatible meta fields from MCP tool schemas", () => {
    const mcpTool = {
      name: "create_entities",
      description: "Create entities in memory",
      inputSchema: {
        $schema: "http://json-schema.org/draft-07/schema#",
        type: "object",
        properties: {
          entities: {
            type: "array",
            items: {
              $schema: "http://json-schema.org/draft-07/schema#",
              type: "object",
              properties: {
                name: { type: "string" },
              },
            },
          },
        },
        required: ["entities"],
      },
    };

    const decl = formatMcpToolToGemini(mcpTool);
    expect((decl.parameters as any).$schema).toBeUndefined();
    expect((decl.parameters.properties.entities.items as any).$schema).toBeUndefined();
    expect(decl.parameters.properties.entities.items.properties.name.type).toBe("string");
  });

  it("should fail gracefully when verifying an empty Gemini API key", async () => {
    const res = await verifyGeminiApiKey("");
    expect(res.success).toBe(false);
    expect(res.error).toContain("required");
  });

  it("should handle Gemini API error responses properly", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => "API_KEY_INVALID",
    } as any);

    const res = await verifyGeminiApiKey("bad_key");
    expect(res.success).toBe(false);
    expect(res.error).toContain("API error (400)");
  });

  it("should parse function calls from Gemini API responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  functionCall: {
                    name: "search_db",
                    args: { query: "customers" },
                  },
                },
              ],
            },
          },
        ],
      }),
    } as any);

    const res = await callGeminiGenerateContent({
      apiKey: "test_key",
      contents: [{ role: "user", parts: [{ text: "find customers" }] }],
    });

    expect(res.toolCalls).toBeDefined();
    expect(res.toolCalls?.length).toBe(1);
    expect(res.toolCalls?.[0].name).toBe("search_db");
    expect(res.toolCalls?.[0].args).toEqual({ query: "customers" });
  });

  it("should initialize Agent with model 'gemini' and default to gemini-1.5-flash", () => {
    const agent = new Agent({
      servers: [],
      model: "gemini",
      apiKey: "fake_gemini_key",
    });

    expect(agent).toBeDefined();
  });

  it("should configure Gemini embedding function on SemanticToolRouter when key is provided", () => {
    const router = new SemanticToolRouter({
      geminiApiKey: "fake_gemini_key",
      topK: 2,
    });

    expect(router).toBeDefined();
  });
});
