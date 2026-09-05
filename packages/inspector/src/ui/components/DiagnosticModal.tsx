import React from "react";
import { ThemeColors, DiagnosticResult } from "../types.js";

interface DiagnosticModalProps {
  colors: ThemeColors;
  show: boolean;
  onClose: () => void;
  diagnostic: DiagnosticResult | null;
  diagnosing: boolean;
  onApplyFix: (args: any) => void;
}

export function DiagnosticModal({
  colors,
  show,
  onClose,
  diagnostic,
  diagnosing,
  onApplyFix,
}: DiagnosticModalProps) {
  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.65)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1100,
      }}
    >
      <div
        style={{
          backgroundColor: colors.surfaceCard1,
          border: colors.border,
          borderRadius: "5px",
          width: "660px",
          maxWidth: "92vw",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: colors.border,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>✨</span>
            <h3 style={{ margin: 0, fontSize: 17, fontFamily: "'Fraunces', serif", color: colors.textHeading }}>
              AI Root Cause Diagnostic & Auto-Fix
            </h3>
          </div>
          <button
            type="button"
            style={{ background: "none", border: "none", color: colors.textBody, cursor: "pointer", fontSize: 16 }}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 22, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
          {diagnosing ? (
            <div style={{ padding: 40, textAlign: "center", color: colors.textHeading }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, fontFamily: "'Fraunces', serif" }}>
                Analyzing tool execution trace...
              </div>
              <div style={{ fontSize: 12, color: colors.textBody }}>
                Evaluating JSON-RPC parameters, schema definitions, and runtime boundary conditions.
              </div>
            </div>
          ) : diagnostic ? (
            <>
              {/* Category & Confidence Badge */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span
                  style={{
                    backgroundColor: colors.accent,
                    color: colors.btnFilledText,
                    padding: "3px 10px",
                    borderRadius: "4px",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                  }}
                >
                  {diagnostic.category}
                </span>
                <span style={{ fontSize: 12, color: colors.textBody }}>
                  Confidence: <strong>{Math.round((diagnostic.confidence || 0.9) * 100)}%</strong>
                </span>
              </div>

              {/* Root Cause Card */}
              <div
                style={{
                  backgroundColor: colors.bg,
                  border: colors.border,
                  borderRadius: "5px",
                  padding: 14,
                }}
              >
                <h4
                  style={{
                    margin: "0 0 6px 0",
                    fontSize: 13,
                    fontFamily: "'Fraunces', serif",
                    color: colors.textHeading,
                  }}
                >
                  Root Cause
                </h4>
                <p style={{ margin: 0, fontSize: 13, color: colors.textBody, lineHeight: 1.5 }}>
                  {diagnostic.rootCause}
                </p>
              </div>

              {/* Suggested Fix Card */}
              <div
                style={{
                  backgroundColor: colors.bg,
                  border: colors.border,
                  borderRadius: "5px",
                  padding: 14,
                }}
              >
                <h4
                  style={{
                    margin: "0 0 6px 0",
                    fontSize: 13,
                    fontFamily: "'Fraunces', serif",
                    color: colors.textHeading,
                  }}
                >
                  Suggested Remediation
                </h4>
                <p style={{ margin: 0, fontSize: 13, color: colors.textBody, lineHeight: 1.5 }}>
                  {diagnostic.suggestedFix}
                </p>
              </div>

              {/* Synthesized Corrected Arguments */}
              {diagnostic.correctedArgs && (
                <div
                  style={{
                    backgroundColor: colors.surfaceCard2,
                    border: colors.border,
                    borderRadius: "5px",
                    padding: 14,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <h4
                      style={{
                        margin: 0,
                        fontSize: 13,
                        fontFamily: "'Fraunces', serif",
                        color: colors.textHeading,
                      }}
                    >
                      Synthesized Arguments Patch
                    </h4>
                    <button
                      type="button"
                      onClick={() => onApplyFix(diagnostic.correctedArgs)}
                      style={{
                        backgroundColor: colors.accent,
                        color: colors.btnFilledText,
                        border: "none",
                        borderRadius: "4px",
                        padding: "6px 14px",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      ✨ Apply to Runner
                    </button>
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
                    }}
                  >
                    {JSON.stringify(diagnostic.correctedArgs, null, 2)}
                  </pre>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
