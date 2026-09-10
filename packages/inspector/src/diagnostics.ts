/**
 * @yumdee/mcp-studio-inspector - AI Diagnostic Engine
 *
 * Automated Root-Cause Analysis (RCA) and patch synthesis for failed MCP tool executions.
 * Powered by Google Gemini with instant rule-based heuristic fallback.
 */

export type DiagnosticCategory =
  | "MISSING_REQUIRED_ARGUMENT"
  | "TYPE_MISMATCH"
  | "ARITHMETIC_BOUNDARY"
  | "INVALID_ENUM"
  | "INVALID_JSON"
  | "SERVER_RUNTIME_ERROR";

export interface DiagnosticRequest {
  toolName?: string;
  schema?: any;
  arguments?: any;
  error?: string;
  logs?: string;
  apiKey?: string;
  model?: string;
}

export interface DiagnosticResult {
  rootCause: string;
  category: DiagnosticCategory;
  suggestedFix: string;
  correctedArgs?: any;
  confidence: number;
  provider: "gemini" | "heuristic";
}

/**
 * Heuristic rule-based diagnostics (zero-latency, zero-key)
 */
export function diagnoseToolFailure(req: DiagnosticRequest): DiagnosticResult {
  const { toolName, schema, error = "" } = req;
  const args = typeof req.arguments === "object" && req.arguments !== null ? { ...req.arguments } : {};
  const errorLower = error.toLowerCase();

  // 1. Check for Arithmetic / Mathematical Boundary Violations (e.g. division by zero)
  if (
    errorLower.includes("divide by zero") ||
    errorLower.includes("division by zero") ||
    (args.operation === "divide" && (args.b === 0 || args.b === "0"))
  ) {
    return {
      category: "ARITHMETIC_BOUNDARY",
      rootCause: "Attempted division by zero, which is mathematically undefined and caused the calculator to reject the call.",
      suggestedFix: "Change the denominator parameter 'b' to a non-zero numeric value (e.g. 1 or 2).",
      correctedArgs: { ...args, b: 2 },
      confidence: 0.99,
      provider: "heuristic",
    };
  }

  // 2. Check Schema Required Fields
  if (schema && typeof schema === "object") {
    const required: string[] = Array.isArray(schema.required) ? schema.required : [];
    const missing = required.filter((key) => args[key] === undefined || args[key] === null || args[key] === "");

    if (missing.length > 0) {
      const firstMissing = missing[0];
      const prop = schema.properties?.[firstMissing] || {};
      const expectedType = prop.type || "string";

      const corrected = { ...args };
      for (const m of missing) {
        const mType = schema.properties?.[m]?.type || "string";
        corrected[m] = mType === "number" ? 5 : mType === "boolean" ? true : "example";
      }

      return {
        category: "MISSING_REQUIRED_ARGUMENT",
        rootCause: `The tool '${toolName || "invoked"}' requires parameter(s) [${missing.join(", ")}], but '${firstMissing}' was omitted from the payload.`,
        suggestedFix: `Add '${firstMissing}' (${expectedType}) to the arguments payload.`,
        correctedArgs: corrected,
        confidence: 0.98,
        provider: "heuristic",
      };
    }

    // 3. Check for Type Mismatches
    if (schema.properties && typeof schema.properties === "object") {
      for (const [key, prop] of Object.entries<any>(schema.properties)) {
        if (args[key] !== undefined && prop?.type) {
          const val = args[key];
          if (prop.type === "number" && typeof val === "string") {
            const parsed = Number(val);
            if (!isNaN(parsed)) {
              return {
                category: "TYPE_MISMATCH",
                rootCause: `Parameter '${key}' was provided as a string ("${val}"), but the schema expects a numeric literal.`,
                suggestedFix: `Convert '${key}' to a raw number without quotation marks.`,
                correctedArgs: { ...args, [key]: parsed },
                confidence: 0.96,
                provider: "heuristic",
              };
            }
          } else if (prop.type === "string" && typeof val === "number") {
            return {
              category: "TYPE_MISMATCH",
              rootCause: `Parameter '${key}' was provided as a number (${val}), but the schema expects a string.`,
              suggestedFix: `Enclose '${key}' in double quotation marks as a string literal.`,
              correctedArgs: { ...args, [key]: String(val) },
              confidence: 0.95,
              provider: "heuristic",
            };
          }

          // 4. Check for Enum Violations
          if (Array.isArray(prop.enum) && prop.enum.length > 0) {
            if (!prop.enum.includes(val)) {
              return {
                category: "INVALID_ENUM",
                rootCause: `Parameter '${key}' value "${val}" is not allowed. Valid options are: [${prop.enum.join(", ")}].`,
                suggestedFix: `Change '${key}' to one of the accepted enum choices: ${prop.enum.join(", ")}.`,
                correctedArgs: { ...args, [key]: prop.enum[0] },
                confidence: 0.97,
                provider: "heuristic",
              };
            }
          }
        }
      }
    }
  }

  // 5. Check for JSON syntax or parsing failure
  if (errorLower.includes("json") || errorLower.includes("syntax") || errorLower.includes("parse")) {
    return {
      category: "INVALID_JSON",
      rootCause: "The arguments payload contains malformed JSON syntax.",
      suggestedFix: "Verify that all keys and strings are enclosed in double quotes and commas are properly positioned.",
      correctedArgs: args,
      confidence: 0.92,
      provider: "heuristic",
    };
  }

  // 6. Generic Server Runtime Error
  return {
    category: "SERVER_RUNTIME_ERROR",
    rootCause: error || `Tool '${toolName || "unknown"}' failed execution with an unhandled exception.`,
    suggestedFix: "Inspect the server standard error (stderr) logs and confirm underlying services or database connections are active.",
    correctedArgs: args,
    confidence: 0.82,
    provider: "heuristic",
  };
}

/**
 * Perform deep Gemini AI Diagnosis with automatic heuristic fallback
 */
export async function diagnoseWithGemini(req: DiagnosticRequest): Promise<DiagnosticResult> {
  const apiKey = req.apiKey || process.env.GEMINI_API_KEY;
  const requestedModel = req.model || "gemini-2.0-flash";

  if (!apiKey) {
    return diagnoseToolFailure(req);
  }

  const prompt = `You are an expert Model Context Protocol (MCP) AI Diagnostic Copilot.
Analyze this failed tool execution and diagnose the root cause:
- Tool Name: ${req.toolName || "unknown"}
- Tool Input Schema: ${JSON.stringify(req.schema || {}, null, 2)}
- Arguments Sent: ${JSON.stringify(req.arguments || {}, null, 2)}
- Error Message: ${req.error || "Unknown error"}
- Stderr Logs: ${req.logs || "None"}

Diagnose the root cause, determine the exact fix, and synthesize corrected arguments.
Respond ONLY with a valid JSON object matching this schema:
{
  "category": "MISSING_REQUIRED_ARGUMENT" | "TYPE_MISMATCH" | "ARITHMETIC_BOUNDARY" | "INVALID_ENUM" | "INVALID_JSON" | "SERVER_RUNTIME_ERROR",
  "rootCause": "Clear concise explanation of why the tool failed",
  "suggestedFix": "Actionable instructions on how to fix the input or system",
  "correctedArgs": { /* complete corrected JSON arguments ready to execute */ },
  "confidence": 0.95
}`;

  const candidateModels = [
    requestedModel,
    "gemini-2.0-flash",
    "gemini-2.5-flash",
    "gemini-flash-latest",
    "gemini-2.0-flash-exp",
    "gemini-1.5-flash-latest",
  ];
  const uniqueCandidates = Array.from(new Set(candidateModels));

  for (const model of uniqueCandidates) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        }),
      });

      if (!res.ok) {
        if (res.status === 404) continue;
        return diagnoseToolFailure(req);
      }

      const data: any = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) continue;

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) continue;

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        category: parsed.category || "SERVER_RUNTIME_ERROR",
        rootCause: parsed.rootCause || "Diagnosed by Gemini Copilot.",
        suggestedFix: parsed.suggestedFix || "Check parameters.",
        correctedArgs: parsed.correctedArgs || req.arguments,
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.95,
        provider: "gemini",
      };
    } catch {
      continue;
    }
  }

  return diagnoseToolFailure(req);
}
