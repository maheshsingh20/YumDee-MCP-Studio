import React, { useState } from "react";
import { ThemeColors, SecurityAuditReport, SecurityIssue, ServerInfo } from "../types.js";

interface SecurityAuditViewProps {
  colors: ThemeColors;
  connected: boolean;
  serverInfo: ServerInfo | null;
  report: SecurityAuditReport | null;
  auditing: boolean;
  onRunAudit: () => void;
}

export function SecurityAuditView({
  colors,
  connected,
  serverInfo,
  report,
  auditing,
  onRunAudit,
}: SecurityAuditViewProps) {
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A+":
      case "A":
        return "#10B981";
      case "B":
        return "#84CC16";
      case "C":
        return "#F59E0B";
      case "D":
        return "#F97316";
      default:
        return "#EF4444";
    }
  };

  const getSeverityStyle = (sev: string) => {
    switch (sev) {
      case "CRITICAL":
        return { bg: "rgba(239, 68, 68, 0.15)", text: "#EF4444", border: "rgba(239, 68, 68, 0.3)" };
      case "HIGH":
        return { bg: "rgba(249, 115, 22, 0.15)", text: "#F97316", border: "rgba(249, 115, 22, 0.3)" };
      case "MEDIUM":
        return { bg: "rgba(245, 158, 11, 0.15)", text: "#F59E0B", border: "rgba(245, 158, 11, 0.3)" };
      case "LOW":
        return { bg: "rgba(59, 130, 246, 0.15)", text: "#3B82F6", border: "rgba(59, 130, 246, 0.3)" };
      default:
        return { bg: "rgba(107, 114, 128, 0.15)", text: "#6B7280", border: "rgba(107, 114, 128, 0.3)" };
    }
  };

  const issues = report?.issues || [];
  const filteredIssues = issues.filter((iss) => {
    if (severityFilter === "ALL") return true;
    return iss.severity === severityFilter;
  });

  const criticalCount = issues.filter((i) => i.severity === "CRITICAL").length;
  const highCount = issues.filter((i) => i.severity === "HIGH").length;
  const mediumCount = issues.filter((i) => i.severity === "MEDIUM").length;
  const lowCount = issues.filter((i) => i.severity === "LOW").length;

  const exportMarkdownReport = () => {
    if (!report) return;
    const content = `# Security Audit Report: ${report.serverName}
Generated: ${new Date(report.timestamp).toLocaleString()}

## Overall Security Score
- **Score:** ${report.overallScore} / 100
- **Letter Grade:** ${report.grade}
- **Total Tools Scanned:** ${report.totalToolsScanned}
- **Summary:** ${report.summary}

## Issue Severity Breakdown
- Critical: ${criticalCount}
- High: ${highCount}
- Medium: ${mediumCount}
- Low: ${lowCount}

## Detected Vulnerabilities & Findings
${report.issues.map((issue, idx) => `
### ${idx + 1}. [${issue.severity}] ${issue.title}
- **Category:** ${issue.category}
- **Tool:** ${issue.toolName || "General"}
- **Description:** ${issue.description}
${issue.evidence ? `- **Evidence:** \`${issue.evidence}\`` : ""}
- **Recommendation:** ${issue.recommendation}
`).join("\n")}

## Strategic Recommendations
${report.recommendations.map((rec) => `- ${rec}`).join("\n")}
`;

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mcp-security-audit-${report.serverName || "server"}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJsonReport = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mcp-security-audit-${report.serverName || "server"}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section
      style={{
        maxWidth: 1120,
        width: "100%",
        margin: "0 auto",
        padding: "0 32px 64px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      {/* Header & Run Audit Button */}
      <div
        style={{
          backgroundColor: colors.surfaceCard1,
          border: colors.border,
          borderRadius: "6px",
          padding: "18px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: "8px",
              backgroundColor: "rgba(82, 110, 72, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
            }}
          >
            🛡️
          </div>
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                fontFamily: "'Fraunces', serif",
                color: colors.textHeading,
              }}
            >
              MCP Security & Prompt-Injection Auditor
            </h2>
            <p style={{ margin: 0, fontSize: 12, color: colors.textBody }}>
              Comprehensive security posture analysis evaluating prompt-injection vectors, command executions, and boundary escapes
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {report && (
            <>
              <button
                type="button"
                onClick={exportMarkdownReport}
                style={{
                  padding: "9px 14px",
                  backgroundColor: colors.surfaceCard2,
                  color: colors.accent,
                  border: colors.border,
                  borderRadius: "5px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                📥 Export Report (.md)
              </button>
              <button
                type="button"
                onClick={exportJsonReport}
                style={{
                  padding: "9px 14px",
                  backgroundColor: colors.surfaceCard2,
                  color: colors.textHeading,
                  border: colors.border,
                  borderRadius: "5px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                JSON
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onRunAudit}
            disabled={!connected || auditing}
            style={{
              padding: "10px 22px",
              backgroundColor: colors.btnFilledBg,
              color: colors.btnFilledText,
              border: "none",
              borderRadius: "5px",
              fontSize: 13,
              fontWeight: 700,
              cursor: !connected || auditing ? "not-allowed" : "pointer",
              opacity: !connected || auditing ? 0.6 : 1,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {auditing ? "Scanning Server..." : "🛡️ Run Full Audit"}
          </button>
        </div>
      </div>

      {/* Warning if server not connected */}
      {!connected && (
        <div
          style={{
            backgroundColor: "rgba(239, 68, 68, 0.08)",
            border: "0.5px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "6px",
            padding: "12px 16px",
            fontSize: 12,
            color: colors.textHeading,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>⚠️</span>
          <span>Please connect to an MCP server in the workspace above before running a security audit.</span>
        </div>
      )}

      {/* Empty State before first audit */}
      {!report && !auditing && (
        <div
          style={{
            backgroundColor: colors.surfaceCard1,
            border: colors.border,
            borderRadius: "6px",
            padding: "60px 24px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 44 }}>🛡️</div>
          <h3
            style={{
              margin: 0,
              fontSize: 18,
              fontFamily: "'Fraunces', serif",
              color: colors.textHeading,
            }}
          >
            No Audit Conducted Yet
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: colors.textBody,
              maxWidth: 480,
              lineHeight: 1.5,
            }}
          >
            Run an automated audit to verify that your connected server's tool schemas and parameter descriptions do not expose LLM prompt-injection vectors, unvalidated shell commands, or path traversal exploits.
          </p>
          <button
            type="button"
            onClick={onRunAudit}
            disabled={!connected}
            style={{
              marginTop: 10,
              padding: "10px 20px",
              backgroundColor: colors.accent,
              color: colors.btnFilledText,
              border: "none",
              borderRadius: "5px",
              fontSize: 13,
              fontWeight: 600,
              cursor: !connected ? "not-allowed" : "pointer",
              opacity: !connected ? 0.6 : 1,
            }}
          >
            Start Security Scan
          </button>
        </div>
      )}

      {/* Auditing in Progress Spinner */}
      {auditing && (
        <div
          style={{
            backgroundColor: colors.surfaceCard1,
            border: colors.border,
            borderRadius: "6px",
            padding: "60px 24px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
          <h3
            style={{
              margin: "0 0 6px 0",
              fontSize: 16,
              fontFamily: "'Fraunces', serif",
              color: colors.textHeading,
            }}
          >
            Analyzing Tool Schemas & Attack Surfaces...
          </h3>
          <p style={{ margin: 0, fontSize: 12, color: colors.textBody }}>
            Evaluating prompt overrides, shell injection vectors, destructive guards, and parameter boundaries.
          </p>
        </div>
      )}

      {/* Security Report Card */}
      {report && !auditing && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Scorecard Hero Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "180px 1fr",
              gap: 16,
            }}
          >
            {/* Grade & Score Card */}
            <div
              style={{
                backgroundColor: colors.surfaceCard1,
                border: colors.border,
                borderRadius: "6px",
                padding: 24,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 900,
                  fontFamily: "'Fraunces', serif",
                  color: getGradeColor(report.grade),
                  lineHeight: 1,
                  marginBottom: 8,
                }}
              >
                {report.grade}
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: colors.textHeading,
                  marginBottom: 4,
                }}
              >
                {report.overallScore} / 100
              </div>
              <div style={{ fontSize: 11, color: colors.textBody }}>
                Overall Security Score
              </div>
            </div>

            {/* Summary & Findings Overview */}
            <div
              style={{
                backgroundColor: colors.surfaceCard1,
                border: colors.border,
                borderRadius: "6px",
                padding: 20,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 14,
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 15,
                      fontFamily: "'Fraunces', serif",
                      color: colors.textHeading,
                    }}
                  >
                    Audit Report: {report.serverName}
                  </h3>
                  <span style={{ fontSize: 11, color: colors.textBody }}>
                    {report.totalToolsScanned} tools evaluated
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: colors.textBody, lineHeight: 1.5 }}>
                  {report.summary}
                </p>
              </div>

              {/* Severity Counts Bar */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <div
                  style={{
                    padding: "6px 12px",
                    borderRadius: "4px",
                    backgroundColor: "rgba(239, 68, 68, 0.12)",
                    border: "0.5px solid rgba(239, 68, 68, 0.3)",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#EF4444",
                  }}
                >
                  Critical: {criticalCount}
                </div>
                <div
                  style={{
                    padding: "6px 12px",
                    borderRadius: "4px",
                    backgroundColor: "rgba(249, 115, 22, 0.12)",
                    border: "0.5px solid rgba(249, 115, 22, 0.3)",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#F97316",
                  }}
                >
                  High: {highCount}
                </div>
                <div
                  style={{
                    padding: "6px 12px",
                    borderRadius: "4px",
                    backgroundColor: "rgba(245, 158, 11, 0.12)",
                    border: "0.5px solid rgba(245, 158, 11, 0.3)",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#F59E0B",
                  }}
                >
                  Medium: {mediumCount}
                </div>
                <div
                  style={{
                    padding: "6px 12px",
                    borderRadius: "4px",
                    backgroundColor: "rgba(59, 130, 246, 0.12)",
                    border: "0.5px solid rgba(59, 130, 246, 0.3)",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#3B82F6",
                  }}
                >
                  Low: {lowCount}
                </div>
              </div>
            </div>
          </div>

          {/* Severity Filter Tabs */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: colors.textBody, letterSpacing: "0.5px" }}>
              FILTER ISSUES:
            </span>
            {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => setSeverityFilter(sev)}
                style={{
                  padding: "4px 10px",
                  borderRadius: "4px",
                  border: colors.border,
                  backgroundColor: severityFilter === sev ? colors.accent : colors.surfaceCard1,
                  color: severityFilter === sev ? colors.btnFilledText : colors.textBody,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Issues List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filteredIssues.length === 0 ? (
              <div
                style={{
                  backgroundColor: colors.surfaceCard1,
                  border: colors.border,
                  borderRadius: "6px",
                  padding: "32px 20px",
                  textAlign: "center",
                  color: "#10B981",
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                ✨ No issues found for the selected filter!
              </div>
            ) : (
              filteredIssues.map((issue) => {
                const style = getSeverityStyle(issue.severity);
                return (
                  <div
                    key={issue.id}
                    style={{
                      backgroundColor: colors.surfaceCard1,
                      border: colors.border,
                      borderRadius: "6px",
                      padding: 16,
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span
                          style={{
                            backgroundColor: style.bg,
                            color: style.text,
                            border: `0.5px solid ${style.border}`,
                            padding: "2px 8px",
                            borderRadius: "3px",
                            fontSize: 10,
                            fontWeight: 800,
                            letterSpacing: "0.5px",
                          }}
                        >
                          {issue.severity}
                        </span>
                        <span
                          style={{
                            backgroundColor: colors.surfaceCard2,
                            color: colors.textBody,
                            padding: "2px 8px",
                            borderRadius: "3px",
                            fontSize: 10,
                            fontWeight: 600,
                          }}
                        >
                          {issue.category}
                        </span>
                        {issue.toolName && (
                          <span style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 700, color: colors.textHeading }}>
                            Tool: {issue.toolName}
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4
                        style={{
                          margin: "0 0 4px 0",
                          fontSize: 14,
                          fontFamily: "'Fraunces', serif",
                          color: colors.textHeading,
                        }}
                      >
                        {issue.title}
                      </h4>
                      <p style={{ margin: 0, fontSize: 12, color: colors.textBody, lineHeight: 1.5 }}>
                        {issue.description}
                      </p>
                    </div>

                    {/* Evidence if present */}
                    {issue.evidence && (
                      <div
                        style={{
                          backgroundColor: colors.surfaceCard2,
                          border: colors.border,
                          borderRadius: "4px",
                          padding: "8px 12px",
                          fontSize: 11,
                          fontFamily: "monospace",
                          color: colors.textHeading,
                        }}
                      >
                        <strong style={{ color: colors.accent }}>Evidence:</strong> {issue.evidence}
                      </div>
                    )}

                    {/* Remediation Box */}
                    <div
                      style={{
                        backgroundColor: colors.bg,
                        border: colors.border,
                        borderRadius: "4px",
                        padding: "8px 12px",
                        fontSize: 12,
                        color: colors.textBody,
                      }}
                    >
                      <strong style={{ color: colors.textHeading }}>💡 Recommendation:</strong>{" "}
                      {issue.recommendation}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </section>
  );
}
