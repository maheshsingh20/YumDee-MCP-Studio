/**
 * @yumdee/mcp-studio-inspector - AI Diagnostic Engine
 *
 * Automated Root-Cause Analysis (RCA) and patch synthesis for failed MCP tool executions.
 * Classifies runtime errors, schema boundary violations, and missing parameters.
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
}

export interface DiagnosticResult {
  rootCause: string;
  category: DiagnosticCategory;
  suggestedFix: string;
  correctedArgs?: any;
  confidence: number;
}

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

      let sampleVal: any = "example";
      if (expectedType === "number" || expectedType === "integer") sampleVal = 10;
      else if (expectedType === "boolean") sampleVal = true;
      else if (expectedType === "array") sampleVal = [];
      else if (expectedType === "object") sampleVal = {};

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
              };
            }
          } else if (prop.type === "string" && typeof val === "number") {
            return {
              category: "TYPE_MISMATCH",
              rootCause: `Parameter '${key}' was provided as a number (${val}), but the schema expects a string.`,
              suggestedFix: `Enclose '${key}' in double quotation marks as a string literal.`,
              correctedArgs: { ...args, [key]: String(val) },
              confidence: 0.95,
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
    };
  }

  // 6. Generic Server Runtime Error
  return {
    category: "SERVER_RUNTIME_ERROR",
    rootCause: error || `Tool '${toolName || "unknown"}' failed execution with an unhandled exception.`,
    suggestedFix: "Inspect the server standard error (stderr) logs and confirm underlying services or database connections are active.",
    correctedArgs: args,
    confidence: 0.82,
  };
}
