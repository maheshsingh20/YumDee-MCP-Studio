import React from "react";
import { ThemeColors, ToolDef } from "../types.js";

interface ToolRunnerProps {
  colors: ThemeColors;
  selectedTool: ToolDef | null;
  toolArgs: Record<string, any>;
  setToolArgs: (args: Record<string, any>) => void;
  toolResult: any;
  invoking: boolean;
  connected: boolean;
  diagnosing: boolean;
  onInvoke: () => void;
  onDiagnose: (tool: ToolDef | null, args: any, error: any) => void;
}

export function ToolRunner({
  colors,
  selectedTool,
  toolArgs,
  setToolArgs,
  toolResult,
  invoking,
  connected,
  diagnosing,
  onInvoke,
  onDiagnose,
}: ToolRunnerProps) {
  return (
    <div
      style={{
        backgroundColor: colors.surfaceCard1,
        border: colors.border,
        borderRadius: "5px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 18px",
          borderBottom: colors.border,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 14, color: colors.textHeading }}>
          {selectedTool ? `Tool: ${selectedTool.name}` : "Tool Runner"}
        </span>
        {selectedTool && (
          <button
            type="button"
            onClick={onInvoke}
            disabled={invoking || !connected}
            style={{
              backgroundColor: colors.accent,
              color: colors.btnFilledText,
              border: "none",
              padding: "5px 14px",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 12,
            }}
          >
            {invoking ? "Invoking..." : "▶ Invoke Tool"}
          </button>
        )}
      </div>

      {/* Body: Schema Form Inputs & Output */}
      <div style={{ flex: 1, overflowY: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
        {selectedTool ? (
          <>
            {/* Parameters Form */}
            <div
              style={{
                backgroundColor: colors.bg,
                border: colors.border,
                borderRadius: "5px",
                padding: 14,
              }}
            >
              <h4 style={{ margin: "0 0 12px 0", fontSize: 13, color: colors.textHeading, fontFamily: "'Fraunces', serif" }}>
                Parameters
              </h4>
              {selectedTool.inputSchema?.properties &&
              Object.keys(selectedTool.inputSchema.properties).length > 0 ? (
                Object.entries(selectedTool.inputSchema.properties).map(([key, prop]) => {
                  const isRequired = selectedTool.inputSchema?.required?.includes(key);
                  return (
                    <div key={key} style={{ marginBottom: 12 }}>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 4, color: colors.textHeading }}>
                        {key} {isRequired && <span style={{ color: colors.accent }}>*</span>}
                        <span style={{ fontSize: 10, color: colors.textBody, marginLeft: 4 }}>({prop.type || "any"})</span>
                      </label>
                      {prop.description && (
                        <div style={{ fontSize: 11, color: colors.textBody, marginBottom: 4 }}>
                          {prop.description}
                        </div>
                      )}
                      <input
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          backgroundColor: colors.inputBg,
                          border: colors.border,
                          color: colors.textHeading,
                          padding: "7px 10px",
                          borderRadius: "4px",
                          fontSize: 13,
                          outline: "none",
                        }}
                        type={prop.type === "number" ? "number" : "text"}
                        value={toolArgs[key] ?? ""}
                        onChange={(e) => setToolArgs({ ...toolArgs, [key]: e.target.value })}
                      />
                    </div>
                  );
                })
              ) : (
                <div style={{ fontSize: 12, color: colors.textBody, fontStyle: "italic" }}>
                  This tool accepts no arguments.
                </div>
              )}
            </div>

            {/* Output Result Box */}
            {toolResult && (
              <div
                style={{
                  backgroundColor: colors.bg,
                  border: colors.border,
                  borderRadius: "5px",
                  padding: 14,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span
                    style={{
                      backgroundColor: toolResult.success ? colors.surfaceCard2 : colors.accent,
                      color: toolResult.success ? colors.accent : colors.btnFilledText,
                      padding: "2px 6px",
                      borderRadius: "3px",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {toolResult.success ? "Success" : "Error"}
                  </span>
                  {toolResult.latencyMs !== undefined && (
                    <span style={{ fontSize: 11, color: colors.textBody }}>{toolResult.latencyMs} ms</span>
                  )}
                </div>

                <pre
                  style={{
                    margin: 0,
                    backgroundColor: colors.inputBg,
                    border: colors.border,
                    padding: 10,
                    borderRadius: "4px",
                    fontSize: 11,
                    fontFamily: "monospace",
                    color: colors.textHeading,
                    overflowX: "auto",
                    maxHeight: 220,
                  }}
                >
                  {JSON.stringify(toolResult.result || toolResult.error, null, 2)}
                </pre>

                {/* Inline AI Diagnostic Copilot Button */}
                {!toolResult.success && (
                  <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      onClick={() => onDiagnose(selectedTool, toolArgs, toolResult.error)}
                      disabled={diagnosing}
                      style={{
                        backgroundColor: colors.surfaceCard2,
                        color: colors.accent,
                        border: `1px solid ${colors.accent}`,
                        borderRadius: "5px",
                        padding: "6px 14px",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {diagnosing ? "Diagnosing..." : "✨ Diagnose with AI Copilot"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div style={{ padding: 30, textAlign: "center", color: colors.textBody, fontSize: 13 }}>
            Select a tool from the left list to test it
          </div>
        )}
      </div>
    </div>
  );
}
