import { describe, it, expect, afterAll, beforeAll } from "vitest";
import { diagnoseToolFailure, createInspector, Inspector } from "../server.js";

describe("AI Diagnostic Engine", () => {
  const calcSchema = {
    type: "object",
    properties: {
      operation: {
        type: "string",
        enum: ["add", "subtract", "multiply", "divide"],
        description: "Arithmetic operation",
      },
      a: { type: "number", description: "First operand" },
      b: { type: "number", description: "Second operand" },
    },
    required: ["operation", "a", "b"],
  };

  it("diagnoses missing required arguments and provides corrected payload", () => {
    const result = diagnoseToolFailure({
      toolName: "calculate",
      schema: calcSchema,
      arguments: { operation: "add", a: 15 },
      error: "Invalid parameters: missing b",
    });

    expect(result.category).toBe("MISSING_REQUIRED_ARGUMENT");
    expect(result.rootCause).toContain("requires parameter(s)");
    expect(result.suggestedFix).toContain("b");
    expect(result.correctedArgs).toBeDefined();
    expect(result.correctedArgs.b).toBe(5);
    expect(result.confidence).toBeGreaterThanOrEqual(0.95);
  });

  it("diagnoses arithmetic boundary errors (division by zero)", () => {
    const result = diagnoseToolFailure({
      toolName: "calculate",
      schema: calcSchema,
      arguments: { operation: "divide", a: 100, b: 0 },
      error: "Division by zero is undefined",
    });

    expect(result.category).toBe("ARITHMETIC_BOUNDARY");
    expect(result.rootCause).toContain("division by zero");
    expect(result.suggestedFix).toContain("non-zero");
    expect(result.correctedArgs.b).toBe(2);
    expect(result.confidence).toBeGreaterThanOrEqual(0.98);
  });

  it("diagnoses type mismatches (string instead of number)", () => {
    const result = diagnoseToolFailure({
      toolName: "calculate",
      schema: calcSchema,
      arguments: { operation: "add", a: "42", b: 10 },
      error: "Expected number for a, received string",
    });

    expect(result.category).toBe("TYPE_MISMATCH");
    expect(result.rootCause).toContain("expects a numeric literal");
    expect(result.correctedArgs.a).toBe(42);
    expect(result.confidence).toBeGreaterThanOrEqual(0.95);
  });

  it("diagnoses invalid enum choices", () => {
    const result = diagnoseToolFailure({
      toolName: "calculate",
      schema: calcSchema,
      arguments: { operation: "modulo", a: 10, b: 3 },
      error: "Unsupported operation modulo",
    });

    expect(result.category).toBe("INVALID_ENUM");
    expect(result.rootCause).toContain("is not allowed");
    expect(result.suggestedFix).toContain("add");
    expect(result.correctedArgs.operation).toBe("add");
    expect(result.confidence).toBeGreaterThanOrEqual(0.95);
  });
});

describe("Inspector /api/diagnose endpoint", () => {
  let inspector: Inspector;
  const testPort = 3199;

  beforeAll(async () => {
    inspector = createInspector({ port: testPort, host: "localhost" });
    await inspector.start();
  });

  afterAll(async () => {
    await inspector.stop();
  });

  it("handles POST /api/diagnose via HTTP", async () => {
    const res = await fetch(`http://localhost:${testPort}/api/diagnose`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        toolName: "calculate",
        schema: {
          type: "object",
          properties: { a: { type: "number" }, b: { type: "number" } },
          required: ["a", "b"],
        },
        arguments: { a: 10 },
        error: "Missing required argument 'b'",
      }),
    });

    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(data.success).toBe(true);
    expect(data.category).toBe("MISSING_REQUIRED_ARGUMENT");
    expect(data.correctedArgs.b).toBeDefined();
  });
});
