import React, { useState, useRef, useEffect } from "react";
import { ThemeColors, AgentMessage, ServerInfo } from "../types.js";

interface AgentPlaygroundProps {
  colors: ThemeColors;
  connected: boolean;
  serverInfo: ServerInfo | null;
  apiKey: string;
  model: string;
  messages: AgentMessage[];
  running: boolean;
  useSemanticRouting: boolean;
  setUseSemanticRouting: (val: boolean) => void;
  onSendMessage: (prompt: string) => void;
  onClearMessages: () => void;
  onOpenSettings: () => void;
}

export function AgentPlayground({
  colors,
  connected,
  serverInfo,
  apiKey,
  model,
  messages,
  running,
  useSemanticRouting,
  setUseSemanticRouting,
  onSendMessage,
  onClearMessages,
  onOpenSettings,
}: AgentPlaygroundProps) {
  const [input, setInput] = useState("");
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, running]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || running) return;
    const prompt = input.trim();
    setInput("");
    onSendMessage(prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleStep = (stepKey: string) => {
    setExpandedSteps((prev) => ({ ...prev, [stepKey]: !prev[stepKey] }));
  };

  const examplePrompts = [
    "Calculate (45 + 55) * 2 and explain each step",
    "List all available tools and summarize what they can do",
    "Perform a multi-step calculation: divide 100 by 4, then add 50",
  ];

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
        gap: 16,
      }}
    >
      {/* Playground Header Card */}
      <div
        style={{
          backgroundColor: colors.surfaceCard1,
          border: colors.border,
          borderRadius: "6px",
          padding: "16px 22px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "8px",
              backgroundColor: "rgba(194, 89, 63, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
            }}
          >
            🤖
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
              Multi-Server Agent Playground
            </h2>
            <p style={{ margin: 0, fontSize: 12, color: colors.textBody }}>
              Autonomous multi-step execution across connected MCP servers powered by Google Gemini
            </p>
          </div>
        </div>

        {/* Controls & Badges */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {/* Model Badge */}
          <div
            onClick={onOpenSettings}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              backgroundColor: colors.surfaceCard2,
              border: colors.border,
              borderRadius: "4px",
              fontSize: 11,
              fontWeight: 600,
              color: colors.textHeading,
              cursor: "pointer",
            }}
            title="Click to change model or API key"
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: apiKey ? "#10B981" : "#F59E0B",
              }}
            />
            <span>{model}</span>
          </div>

          {/* Semantic Router Toggle */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              color: colors.textHeading,
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <input
              type="checkbox"
              checked={useSemanticRouting}
              onChange={(e) => setUseSemanticRouting(e.target.checked)}
              style={{ accentColor: colors.accent, cursor: "pointer" }}
            />
            <span>Dynamic Semantic Router</span>
          </label>

          {/* Clear Messages */}
          {messages.length > 0 && (
            <button
              type="button"
              onClick={onClearMessages}
              style={{
                padding: "5px 10px",
                backgroundColor: colors.surfaceCard2,
                border: colors.border,
                borderRadius: "4px",
                fontSize: 11,
                fontWeight: 600,
                color: colors.textBody,
                cursor: "pointer",
              }}
            >
              Clear Chat
            </button>
          )}
        </div>
      </div>

      {/* Warning if disconnected or missing key */}
      {(!connected || !apiKey) && (
        <div
          style={{
            backgroundColor: !connected ? "rgba(239, 68, 68, 0.08)" : "rgba(245, 158, 11, 0.08)",
            border: !connected ? "0.5px solid rgba(239, 68, 68, 0.3)" : "0.5px solid rgba(245, 158, 11, 0.3)",
            borderRadius: "6px",
            padding: "12px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 12,
            color: colors.textHeading,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>{!connected ? "⚠️" : "🔑"}</span>
            <span>
              {!connected
                ? "No MCP server connected. Please connect a server in the workspace above to give the agent tools."
                : "Gemini API key is not configured. Set your free key to run the live agent."}
            </span>
          </div>
          {!apiKey && (
            <button
              type="button"
              onClick={onOpenSettings}
              style={{
                backgroundColor: colors.accent,
                color: colors.btnFilledText,
                border: "none",
                borderRadius: "4px",
                padding: "5px 12px",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Configure API Key
            </button>
          )}
        </div>
      )}

      {/* Chat Messages Container */}
      <div
        style={{
          backgroundColor: colors.surfaceCard1,
          border: colors.border,
          borderRadius: "6px",
          minHeight: 460,
          maxHeight: 600,
          overflowY: "auto",
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              margin: "auto",
              textAlign: "center",
              maxWidth: 480,
              padding: "40px 0",
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>✨</div>
            <h3
              style={{
                margin: "0 0 8px 0",
                fontSize: 16,
                fontFamily: "'Fraunces', serif",
                color: colors.textHeading,
              }}
            >
              Interactive Gemini Multi-Server Agent
            </h3>
            <p style={{ margin: "0 0 20px 0", fontSize: 13, color: colors.textBody, lineHeight: 1.5 }}>
              Ask questions or provide multi-step goals. Gemini analyzes connected MCP tool schemas, calls tools in real-time, inspects results, and returns the verified solution.
            </p>

            {/* Example Prompt Chips */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", color: colors.textHeading }}>
                TRY AN EXAMPLE GOAL:
              </span>
              {examplePrompts.map((example, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSendMessage(example)}
                  disabled={!connected || !apiKey || running}
                  style={{
                    backgroundColor: colors.surfaceCard2,
                    border: colors.border,
                    borderRadius: "4px",
                    padding: "8px 12px",
                    fontSize: 12,
                    color: colors.textBody,
                    textAlign: "left",
                    cursor: !connected || !apiKey || running ? "not-allowed" : "pointer",
                    opacity: !connected || !apiKey || running ? 0.6 : 1,
                    transition: "all 0.15s ease",
                  }}
                >
                  💬 {example}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                gap: 8,
              }}
            >
              {/* Message Role Header */}
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: colors.textBody,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>{msg.role === "user" ? "👤 YOU" : "🤖 GEMINI AGENT"}</span>
                <span style={{ fontWeight: 400, opacity: 0.7 }}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>

              {/* Semantic Router Metrics Badge (Assistant only) */}
              {msg.metrics && msg.metrics.tokenSavingsPercent !== undefined && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 10px",
                    borderRadius: "4px",
                    backgroundColor: "rgba(16, 185, 129, 0.1)",
                    border: "0.5px solid rgba(16, 185, 129, 0.3)",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#10B981",
                  }}
                >
                  <span>🧠 Semantic Tool Router:</span>
                  <span>
                    Retrieved {msg.metrics.selectedTools} of {msg.metrics.totalCandidateTools} tools (
                    <strong>{msg.metrics.tokenSavingsPercent}% token reduction</strong>)
                  </span>
                </div>
              )}

              {/* Tool Execution Step Traces */}
              {msg.steps && msg.steps.length > 0 && (
                <div
                  style={{
                    width: "100%",
                    maxWidth: 720,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: colors.textHeading,
                      letterSpacing: "0.5px",
                    }}
                  >
                    TOOL EXECUTION TRACE ({msg.steps.length} STEP{msg.steps.length > 1 ? "S" : ""})
                  </div>
                  {msg.steps.map((step, idx) => {
                    const stepKey = `${msg.id}-step-${idx}`;
                    const isExpanded = !!expandedSteps[stepKey];
                    return (
                      <div
                        key={idx}
                        style={{
                          backgroundColor: colors.surfaceCard2,
                          border: colors.border,
                          borderRadius: "5px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          onClick={() => toggleStep(stepKey)}
                          style={{
                            padding: "8px 12px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            cursor: "pointer",
                            fontSize: 12,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span
                              style={{
                                width: 18,
                                height: 18,
                                borderRadius: "3px",
                                backgroundColor: colors.accent,
                                color: colors.btnFilledText,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 10,
                                fontWeight: 700,
                              }}
                            >
                              {idx + 1}
                            </span>
                            <span style={{ fontFamily: "monospace", fontWeight: 700, color: colors.textHeading }}>
                              tools/call: {step.toolName}
                            </span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {step.latencyMs !== undefined && (
                              <span style={{ fontSize: 11, color: colors.textBody }}>
                                {step.latencyMs}ms
                              </span>
                            )}
                            <span
                              style={{
                                fontSize: 11,
                                padding: "2px 6px",
                                borderRadius: "3px",
                                backgroundColor: step.error ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
                                color: step.error ? "#EF4444" : "#10B981",
                                fontWeight: 600,
                              }}
                            >
                              {step.error ? "Failed" : "Success"}
                            </span>
                            <span style={{ fontSize: 11, color: colors.textBody }}>
                              {isExpanded ? "▲" : "▼"}
                            </span>
                          </div>
                        </div>

                        {/* Collapsible Tool Arguments & Result */}
                        {isExpanded && (
                          <div
                            style={{
                              padding: "10px 14px",
                              borderTop: colors.border,
                              backgroundColor: colors.inputBg,
                              display: "flex",
                              flexDirection: "column",
                              gap: 8,
                            }}
                          >
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 600, color: colors.textBody, marginBottom: 4 }}>
                                Arguments:
                              </div>
                              <pre
                                style={{
                                  margin: 0,
                                  fontSize: 11,
                                  fontFamily: "monospace",
                                  backgroundColor: colors.surfaceCard1,
                                  padding: 8,
                                  borderRadius: "4px",
                                  border: colors.border,
                                  overflowX: "auto",
                                }}
                              >
                                {JSON.stringify(step.args, null, 2)}
                              </pre>
                            </div>
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 600, color: colors.textBody, marginBottom: 4 }}>
                                Result:
                              </div>
                              <pre
                                style={{
                                  margin: 0,
                                  fontSize: 11,
                                  fontFamily: "monospace",
                                  backgroundColor: colors.surfaceCard1,
                                  padding: 8,
                                  borderRadius: "4px",
                                  border: colors.border,
                                  overflowX: "auto",
                                  color: step.error ? "#EF4444" : colors.textHeading,
                                }}
                              >
                                {step.error || JSON.stringify(step.result, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Message Content Bubble */}
              {msg.content && (
                <div
                  style={{
                    backgroundColor: msg.role === "user" ? colors.accent : colors.surfaceCard2,
                    color: msg.role === "user" ? colors.btnFilledText : colors.textHeading,
                    border: msg.role === "user" ? "none" : colors.border,
                    borderRadius: "6px",
                    padding: "12px 16px",
                    maxWidth: 720,
                    fontSize: 13,
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {msg.content}
                </div>
              )}
            </div>
          ))
        )}

        {/* Loading execution state */}
        {running && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 12 }}>
            <span style={{ fontSize: 16 }}>⏳</span>
            <div style={{ fontSize: 13, color: colors.textHeading, fontWeight: 500 }}>
              Gemini Agent is evaluating tools and orchestrating execution...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          gap: 10,
          alignItems: "flex-end",
        }}
      >
        <textarea
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Instruct the agent (e.g. 'Calculate the square root of 144, then divide by 3'). Press Enter to run..."
          disabled={!connected || !apiKey || running}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: "5px",
            border: colors.border,
            backgroundColor: colors.inputBg,
            color: colors.textHeading,
            fontSize: 13,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            resize: "none",
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={!connected || !apiKey || running || !input.trim()}
          style={{
            height: 52,
            padding: "0 22px",
            backgroundColor: colors.accent,
            color: colors.btnFilledText,
            border: "none",
            borderRadius: "5px",
            fontSize: 13,
            fontWeight: 700,
            cursor: !connected || !apiKey || running || !input.trim() ? "not-allowed" : "pointer",
            opacity: !connected || !apiKey || running || !input.trim() ? 0.6 : 1,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {running ? "Orchestrating..." : "🚀 Run Agent"}
        </button>
      </form>
    </section>
  );
}
