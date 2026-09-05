import React from "react";
import { ThemeColors, ReplayItem } from "../types.js";

interface ReplayModalProps {
  colors: ThemeColors;
  show: boolean;
  onClose: () => void;
  savedSessions: any[];
  onRunReplay: (id: string) => void;
  replaying: boolean;
  replayResults: ReplayItem[] | null;
}

export function ReplayModal({
  colors,
  show,
  onClose,
  savedSessions,
  onRunReplay,
  replaying,
  replayResults,
}: ReplayModalProps) {
  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: colors.surfaceCard1,
          border: colors.border,
          borderRadius: "5px",
          width: "720px",
          maxWidth: "92vw",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
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
          <h3 style={{ margin: 0, fontSize: 18, fontFamily: "'Fraunces', serif", color: colors.textHeading }}>
            Session Replay & Regression Diff
          </h3>
          <button
            type="button"
            style={{ background: "none", border: "none", color: colors.textBody, cursor: "pointer", fontSize: 14 }}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 20, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ fontSize: 13, color: colors.textBody, margin: 0 }}>
            Select a recorded session to replay all tool invocations against the active server and detect regressions.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 180, overflowY: "auto" }}>
            {savedSessions.length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", color: colors.textBody, fontSize: 13 }}>
                No saved sessions found in storage.
              </div>
            ) : (
              savedSessions.map((s) => (
                <div
                  key={s.id}
                  style={{
                    backgroundColor: colors.surfaceCard2,
                    border: colors.border,
                    padding: 12,
                    borderRadius: "5px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <strong style={{ color: colors.textHeading }}>{s.serverInfo.name}</strong> &bull;{" "}
                    <span style={{ fontSize: 12, color: colors.textBody }}>{new Date(s.startedAt).toLocaleString()}</span>
                    <div style={{ fontSize: 11, color: colors.textBody, marginTop: 2 }}>
                      Events: {s.events.length} | ID: {s.id.slice(0, 8)}...
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRunReplay(s.id)}
                    disabled={replaying}
                    style={{
                      backgroundColor: colors.accent,
                      color: colors.btnFilledText,
                      border: "none",
                      padding: "6px 14px",
                      borderRadius: "4px",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {replaying ? "Replaying..." : "Replay"}
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Replay Results Diff Display */}
          {replayResults && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
              <h4 style={{ margin: 0, fontSize: 14, fontFamily: "'Fraunces', serif", color: colors.textHeading }}>
                Replay Execution Diff ({replayResults.length} tool calls)
              </h4>
              {replayResults.map((r, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: colors.bg,
                    border: colors.border,
                    borderRadius: "4px",
                    padding: 10,
                    fontSize: 12,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, color: colors.accent }}>{r.toolName}</span>
                    <span
                      style={{
                        backgroundColor: r.matched ? colors.badgeBg : colors.accent,
                        color: r.matched ? colors.badgeText : colors.btnFilledText,
                        padding: "1px 6px",
                        borderRadius: "3px",
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      {r.matched ? "MATCHED (0 REGRESSIONS)" : "OUTPUT DIFF DETECTED"}
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 11 }}>
                    <div>
                      <div style={{ color: colors.textBody, marginBottom: 2 }}>Original: {r.originalLatencyMs}ms</div>
                      <pre
                        style={{
                          margin: 0,
                          backgroundColor: colors.inputBg,
                          border: colors.border,
                          padding: 6,
                          borderRadius: "3px",
                          fontSize: 10,
                          maxHeight: 100,
                          overflowY: "auto",
                          color: colors.textHeading,
                        }}
                      >
                        {JSON.stringify(r.originalResponse, null, 2)}
                      </pre>
                    </div>

                    <div>
                      <div style={{ color: colors.textBody, marginBottom: 2 }}>Replayed: {r.replayedLatencyMs}ms</div>
                      <pre
                        style={{
                          margin: 0,
                          backgroundColor: colors.inputBg,
                          border: colors.border,
                          padding: 6,
                          borderRadius: "3px",
                          fontSize: 10,
                          maxHeight: 100,
                          overflowY: "auto",
                          color: colors.textHeading,
                        }}
                      >
                        {JSON.stringify(r.replayedResponse || r.replayedError, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
