/**
 * @yumdee/mcp-studio-agent-kit - Google Gemini Model & Embeddings Adapter
 *
 * Lightweight, zero-dependency Gemini integration using native Node 18+ fetch.
 * Supports:
 * - Multimodal chat and function calling (MCP tool integration)
 * - Dense vector embeddings (text-embedding-004) for Semantic Tool Routing
 * - Live key verification and latency benchmarking
 */

export interface GeminiFunctionDeclaration {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface GeminiPart {
  text?: string;
  functionCall?: {
    name: string;
    args: Record<string, any>;
  };
  functionResponse?: {
    name: string;
    response: Record<string, any>;
  };
}

export interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

export interface GeminiResponse {
  text?: string;
  toolCalls?: Array<{ name: string; args: Record<string, any> }>;
  raw?: any;
}

/**
 * Sanitize MCP JSON Schema to OpenAPI schema accepted by Google Gemini
 * Strips $schema, $defs, title, and invalid meta properties recursively.
 */
export function cleanSchemaForGemini(schema: any): any {
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
    return { type: "object", properties: {} };
  }

  const clean: Record<string, any> = {};

  // Standard OpenAPI / Gemini schema properties
  if (schema.type) clean.type = schema.type;
  if (schema.description) clean.description = schema.description;
  if (Array.isArray(schema.enum)) clean.enum = schema.enum;
  if (Array.isArray(schema.required)) clean.required = schema.required;
  if (typeof schema.nullable === "boolean") clean.nullable = schema.nullable;
  if (schema.format) clean.format = schema.format;

  // Recursively sanitize properties
  if (schema.properties && typeof schema.properties === "object" && !Array.isArray(schema.properties)) {
    clean.properties = {};
    for (const [propName, propVal] of Object.entries(schema.properties)) {
      clean.properties[propName] = cleanSchemaForGemini(propVal);
    }
  }

  // Recursively sanitize array items
  if (schema.items && typeof schema.items === "object") {
    clean.items = cleanSchemaForGemini(schema.items);
  }

  // Default type fallback
  if (!clean.type) {
    clean.type = clean.properties ? "object" : "string";
  }

  return clean;
}

/**
 * Format MCP ToolDefinition into Gemini function declaration format
 */
export function formatMcpToolToGemini(tool: {
  name: string;
  description?: string;
  inputSchema?: any;
}): GeminiFunctionDeclaration {
  return {
    name: tool.name,
    description: tool.description || `Execute ${tool.name}`,
    parameters: cleanSchemaForGemini(tool.inputSchema),
  };
}

/**
 * Call Gemini GenerateContent API with optional function declarations
/**
 * List all models supported by the provided API key for generateContent
 */
export async function listSupportedGeminiModels(apiKey: string): Promise<string[]> {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!res.ok) return [];
    const data: any = await res.json();
    if (!Array.isArray(data.models)) return [];
    return data.models
      .filter((m: any) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m: any) => m.name?.replace(/^models\//, ""))
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Call Gemini GenerateContent API with optional function declarations
 * Automatically falls back to supported Flash models if a deprecated model is requested
 */
export async function callGeminiGenerateContent(options: {
  apiKey: string;
  model?: string;
  contents: GeminiContent[];
  tools?: GeminiFunctionDeclaration[];
  systemInstruction?: string;
}): Promise<GeminiResponse> {
  const {
    apiKey,
    model: requestedModel = "gemini-2.0-flash",
    contents,
    tools = [],
    systemInstruction,
  } = options;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is required to call Google Gemini API");
  }

  const payload: Record<string, any> = { contents };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  if (tools.length > 0) {
    payload.tools = [
      {
        functionDeclarations: tools,
      },
    ];
  }

  // Model fallback candidates if requested model is 404/deprecated
  const candidateModels: string[] = [
    requestedModel,
    "gemini-2.0-flash",
    "gemini-2.5-flash",
    "gemini-flash-latest",
    "gemini-2.0-flash-exp",
    "gemini-1.5-flash-latest",
  ];

  // Deduplicate candidates preserving order
  const uniqueCandidates = Array.from(new Set(candidateModels));
  let lastError: any;

  for (const model of uniqueCandidates) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorBody = await res.text();
        lastError = new Error(`Gemini API error (${res.status}): ${errorBody}`);
        if (res.status === 404) {
          // Model deprecated or not found, try next candidate
          continue;
        }
        throw lastError;
      }

      const data: any = await res.json();
      const candidate = data.candidates?.[0];
      const parts: GeminiPart[] = candidate?.content?.parts || [];

      let text: string | undefined;
      const toolCalls: Array<{ name: string; args: Record<string, any> }> = [];

      for (const part of parts) {
        if (part.text) {
          text = (text ? text + "\n" : "") + part.text;
        }
        if (part.functionCall) {
          toolCalls.push({
            name: part.functionCall.name,
            args: part.functionCall.args || {},
          });
        }
      }

      return {
        text,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        raw: data,
      };
    } catch (err: any) {
      lastError = err;
      if (err.message?.includes("404")) {
        continue;
      }
      throw err;
    }
  }

  // If all static candidates failed with 404, try dynamic discovery
  try {
    const supported = await listSupportedGeminiModels(apiKey);
    const flashModel = supported.find((m) => m.includes("flash")) || supported[0];
    if (flashModel && !uniqueCandidates.includes(flashModel)) {
      const fallbackEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${flashModel}:generateContent?key=${apiKey}`;
      const res = await fetch(fallbackEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data: any = await res.json();
        const candidate = data.candidates?.[0];
        const parts: GeminiPart[] = candidate?.content?.parts || [];
        let text: string | undefined;
        const toolCalls: Array<{ name: string; args: Record<string, any> }> = [];
        for (const part of parts) {
          if (part.text) text = (text ? text + "\n" : "") + part.text;
          if (part.functionCall) toolCalls.push({ name: part.functionCall.name, args: part.functionCall.args || {} });
        }
        return { text, toolCalls: toolCalls.length > 0 ? toolCalls : undefined, raw: data };
      }
    }
  } catch {}

  throw lastError || new Error("Failed to communicate with Google Gemini API");
}

/**
/**
 * Generate dense vector embeddings using Google Gemini Embedding models
 * Automatically tries gemini-embedding-001, embedding-001, and text-embedding-004
 */
export async function generateGeminiEmbedding(options: {
  apiKey: string;
  text: string;
  model?: string;
}): Promise<number[]> {
  const { apiKey, text } = options;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is required to generate embeddings");
  }

  const candidateModels = options.model
    ? [options.model, "gemini-embedding-001", "embedding-001"]
    : ["gemini-embedding-001", "embedding-001", "text-embedding-004"];

  let lastError: any;

  for (const model of candidateModels) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${apiKey}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: {
            parts: [{ text }],
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        lastError = new Error(`Gemini Embeddings error (${res.status}) for ${model}: ${errText}`);
        if (res.status === 404) {
          continue; // Try next candidate model
        }
        throw lastError;
      }

      const data: any = await res.json();
      const values = data.embedding?.values;

      if (!Array.isArray(values)) {
        throw new Error("Gemini did not return valid embedding values vector");
      }

      return values;
    } catch (err) {
      lastError = err;
      // If it's not a 404, or if it's the last candidate, keep going or throw
    }
  }

  throw lastError || new Error("Failed to generate Gemini embeddings with candidate models");
}

/**
 * Verify Gemini API key validity and test response latency
 */
export async function verifyGeminiApiKey(
  apiKey: string,
  model: string = "gemini-1.5-flash"
): Promise<{ success: boolean; latencyMs: number; model: string; error?: string }> {
  const start = Date.now();
  try {
    const res = await callGeminiGenerateContent({
      apiKey,
      model,
      contents: [
        {
          role: "user",
          parts: [{ text: "ping" }],
        },
      ],
    });
    const latencyMs = Date.now() - start;
    return {
      success: true,
      latencyMs,
      model,
    };
  } catch (err: any) {
    return {
      success: false,
      latencyMs: Date.now() - start,
      model,
      error: err.message || "Failed to authenticate with Google Gemini API",
    };
  }
}
