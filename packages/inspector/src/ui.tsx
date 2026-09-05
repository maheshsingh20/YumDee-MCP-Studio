/**
 * MCP Studio Inspector Frontend UI
 *
 * Warm, Minimalist Design System with Light/Dark Mode Palette Swap:
 * - Shared layout, typography, and spacing; only color values swap.
 * - Flat design throughout: no gradients, no drop shadows, no glow effects.
 * - 4-6px corner radius on all buttons, cards, badges.
 * - 0.5px color-tinted borders matching the palette.
 * - Fraunces serif for logo, headings, subheadings; Plus Jakarta Sans for body, nav, buttons.
 */

import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";

export interface InspectorUIProps {
  apiUrl?: string;
}

interface ToolDef {
  name: string;
  description?: string;
  inputSchema?: {
    type?: string;
    properties?: Record<string, { type?: string; description?: string }>;
    required?: string[];
  };
}

interface ServerInfo {
  name: string;
  version: string;
  transport: string;
  command?: string;
  endpoint?: string;
}

interface EventItem {
  type: string;
  timestamp: string;
  id?: number;
  method?: string;
  params?: any;
  result?: any;
  error?: any;
  message?: string;
  latencyMs?: number;
}

export function InspectorUI({ apiUrl = "http://localhost:3000" }: InspectorUIProps) {
  // Theme state: "light" | "dark"
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // MCP Connection & Workspace State
  const [transport, setTransport] = useState<"stdio" | "http">("stdio");
  const [command, setCommand] = useState("node examples/math-server/dist/index.js");
  const [httpUrl, setHttpUrl] = useState("http://localhost:8000/mcp");
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [tools, setTools] = useState<ToolDef[]>([]);
  const [selectedTool, setSelectedTool] = useState<ToolDef | null>(null);
  const [toolArgs, setToolArgs] = useState<Record<string, any>>({});
  const [toolResult, setToolResult] = useState<any>(null);
  const [invoking, setInvoking] = useState(false);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [savedSessions, setSavedSessions] = useState<any[]>([]);
  const [showReplayModal, setShowReplayModal] = useState(false);
  const [replayResults, setReplayResults] = useState<any[] | null>(null);
  const [replaying, setReplaying] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [diagnostic, setDiagnostic] = useState<any | null>(null);
  const [diagnosing, setDiagnosing] = useState(false);
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);

  const eventEndRef = useRef<HTMLDivElement>(null);

  // SSE Live Event Stream
  useEffect(() => {
    const sse = new EventSource(`${apiUrl}/api/events/stream`);
    sse.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.event) {
          setEvents((prev) => [...prev, data.event]);
        }
      } catch {}
    };
    return () => sse.close();
  }, [apiUrl]);

  useEffect(() => {
    eventEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const showNotification = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      const payload =
        transport === "stdio"
          ? { transport: "stdio", command }
          : { transport: "http", url: httpUrl };

      const res = await fetch(`${apiUrl}/api/servers/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Connection failed");

      setSessionId(data.sessionId);
      setServerInfo(data.serverInfo);
      setTools(data.tools || []);
      if (data.tools?.length > 0) {
        setSelectedTool(data.tools[0]);
        initToolArgs(data.tools[0]);
      }
      if (data.session?.events) {
        setEvents(data.session.events);
      }
      setConnected(true);
      showNotification(`Connected to ${data.serverInfo.name} (${data.serverInfo.transport})!`);
    } catch (err: any) {
      alert(`Connection failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!sessionId) return;
    try {
      await fetch(`${apiUrl}/api/servers/${sessionId}/disconnect`, { method: "POST" });
    } catch {}
    setConnected(false);
    setSessionId(null);
    setServerInfo(null);
    setTools([]);
    setSelectedTool(null);
    showNotification("Disconnected from server.");
  };

  const initToolArgs = (tool: ToolDef) => {
    const initial: Record<string, any> = {};
    if (tool.inputSchema?.properties) {
      for (const [key, prop] of Object.entries(tool.inputSchema.properties)) {
        initial[key] = prop.type === "number" ? 0 : "";
      }
    }
    setToolArgs(initial);
  };

  const selectTool = (tool: ToolDef) => {
    setSelectedTool(tool);
    initToolArgs(tool);
    setToolResult(null);
  };

  const handleInvoke = async () => {
    if (!sessionId || !selectedTool) return;
    setInvoking(true);
    setToolResult(null);

    try {
      const processedArgs: Record<string, any> = { ...toolArgs };
      if (selectedTool.inputSchema?.properties) {
        for (const [key, prop] of Object.entries(selectedTool.inputSchema.properties)) {
          if (prop.type === "number") {
            processedArgs[key] = Number(processedArgs[key]);
          }
        }
      }

      const res = await fetch(`${apiUrl}/api/servers/${sessionId}/invoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolName: selectedTool.name,
          args: processedArgs,
        }),
      });

      const data = await res.json();
      setToolResult(data);
      if (data.session?.events) {
        setEvents(data.session.events);
      }
      showNotification(`Invoked ${selectedTool.name} in ${data.latencyMs}ms`);
    } catch (err: any) {
      setToolResult({ success: false, error: err.message });
    } finally {
      setInvoking(false);
    }
  };

  const handleSaveSession = async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`${apiUrl}/api/sessions/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      showNotification(`Session saved! (ID: ${data.savedId.slice(0, 8)}...)`);
    } catch (err: any) {
      alert("Failed to save session: " + err.message);
    }
  };

  const handleOpenReplay = async () => {
    setShowReplayModal(true);
    try {
      const res = await fetch(`${apiUrl}/api/sessions`);
      const data = await res.json();
      setSavedSessions(data.sessions || []);
    } catch {}
  };

  const handleRunReplay = async (targetId: string) => {
    if (!sessionId) {
      alert("Please connect to a live server first to replay against.");
      return;
    }
    setReplaying(true);
    setReplayResults(null);
    try {
      const res = await fetch(`${apiUrl}/api/sessions/${targetId}/replay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetSessionId: sessionId }),
      });
      const data = await res.json();
      setReplayResults(data.replays || []);
    } catch (err: any) {
      alert("Replay failed: " + err.message);
    } finally {
      setReplaying(false);
    }
  };

  const handleDiagnose = async (targetTool?: ToolDef | null, targetArgs?: any, targetError?: any) => {
    setDiagnosing(true);
    setShowDiagnosticModal(true);
    setDiagnostic(null);
    const toolToInspect = targetTool || selectedTool;
    const argsToInspect = targetArgs !== undefined ? targetArgs : toolArgs;
    const errorToInspect =
      targetError !== undefined
        ? typeof targetError === "string"
          ? targetError
          : JSON.stringify(targetError)
        : toolResult?.error
        ? typeof toolResult.error === "string"
          ? toolResult.error
          : JSON.stringify(toolResult.error)
        : "Unknown execution error";

    try {
      const res = await fetch(`${apiUrl}/api/diagnose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolName: toolToInspect?.name,
          schema: toolToInspect?.inputSchema,
          arguments: argsToInspect,
          error: errorToInspect,
        }),
      });
      const data = await res.json();
      setDiagnostic(data);
    } catch (err: any) {
      setDiagnostic({
        rootCause: err.message || "Failed to contact diagnostic engine.",
        category: "SERVER_RUNTIME_ERROR",
        suggestedFix: "Check that the Inspector API server is running on port 3000.",
        confidence: 0.5,
      });
    } finally {
      setDiagnosing(false);
    }
  };

  const handleApplyFix = (correctedArgs: any) => {
    if (correctedArgs && typeof correctedArgs === "object") {
      setToolArgs(correctedArgs);
      showNotification("✨ AI Suggested Arguments applied to form runner!");
      setShowDiagnosticModal(false);
    }
  };

  const handleExportJsonl = () => {
    if (events.length === 0) return;
    const jsonl = events.map((e) => JSON.stringify(e)).join("\n");
    const blob = new Blob([jsonl], { type: "application/x-jsonlines" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mcp-session-${Date.now()}.jsonl`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredTools = tools.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Exact Design System Color Tokens per User Specification
  const isDark = theme === "dark";
  const colors = isDark
    ? {
        bg: "#211514", // deep warm brown-black, not cold gray
        surfaceCard1: "#281A18", // warm charcoal header & cards
        surfaceCard2: "#3E2830", // muted plum-pink badges & alternating cards
        headerBg: "#281A18",
        accent: "#E39CB0", // dusty rose replacing maroon
        border: "0.5px solid #4A332F", // warm muted brown
        textHeading: "#F7ECE9", // warm off-white
        textBody: "#C9B8AF", // muted warm gray
        btnFilledText: "#2C1017", // dark maroon-brown on filled accent
        btnOutlineBorder: "0.5px solid #E39CB0",
        btnOutlineText: "#E39CB0",
        placeholderBlock: "#3E2830",
        circleGraphic: "#E39CB0",
        badgeBg: "#3E2830",
        badgeText: "#E39CB0",
        inputBg: "#1C1110",
      }
    : {
        bg: "#F7F0E5", // blended beige/off-white
        surfaceCard1: "#FBF7F1", // lighter off-white
        surfaceCard2: "#F4D9E1", // light pink badges & alternating cards
        headerBg: "#FBF7F1",
        accent: "#6E1E2B", // deep maroon
        border: "0.5px solid #D9BFC4", // soft maroon-tinted taupe
        textHeading: "#4A1420", // dark maroon-brown
        textBody: "#6B5D50", // warm gray-brown
        btnFilledText: "#FBEAF0", // light pink on filled accent
        btnOutlineBorder: "0.5px solid #6E1E2B",
        btnOutlineText: "#6E1E2B",
        placeholderBlock: "#F4D9E1",
        circleGraphic: "#6E1E2B",
        badgeBg: "#F4D9E1",
        badgeText: "#6E1E2B",
        inputBg: "#FFFFFF",
      };

  const responseEvents = events.filter((e) => e.type === "response" && typeof e.latencyMs === "number");
  const p50Latency =
    responseEvents.length > 0
      ? responseEvents[Math.floor(responseEvents.length * 0.5)].latencyMs
      : 0;

  return (
    <div
      style={{
        backgroundColor: colors.bg,
        color: colors.textBody,
        minHeight: "100vh",
        fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
        display: "flex",
        flexDirection: "column",
        transition: "background-color 0.2s ease, color 0.2s ease",
      }}
    >
      {/* Toast Notification */}
      {statusMessage && (
        <div
          style={{
            position: "fixed",
            top: 24,
            right: 24,
            backgroundColor: colors.accent,
            color: colors.btnFilledText,
            padding: "10px 18px",
            borderRadius: "5px",
            border: colors.border,
            fontWeight: 600,
            fontSize: 13,
            zIndex: 9999,
          }}
        >
          {statusMessage}
        </div>
      )}

      {/* 1. TOP NAV BAR */}
      <header
        style={{
          backgroundColor: colors.headerBg,
          borderBottom: colors.border,
          padding: "16px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          transition: "background-color 0.2s ease, border-color 0.2s ease",
        }}
      >
        {/* Logo Left (Serif: Fraunces) */}
        <div
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 22,
            fontWeight: 700,
            color: colors.accent,
            letterSpacing: "-0.5px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>MCP Studio</span>
        </div>

        {/* Text Links Center (Sans-serif) */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: 32,
          }}
        >
          <span
            style={{
              color: colors.textHeading,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              borderBottom: `1.5px solid ${colors.accent}`,
              paddingBottom: 2,
            }}
          >
            Inspector
          </span>
          <span
            style={{
              color: colors.textBody,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
            onClick={() => showNotification("Registry catalog is enabled in CLI")}
          >
            Registry
          </span>
          <span
            style={{
              color: colors.textBody,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
            onClick={handleOpenReplay}
          >
            Bench & Replay
          </span>
          <span
            style={{
              color: colors.textBody,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
            onClick={() => showNotification("Agent-Kit multi-server orchestrator ready")}
          >
            Agent-Kit
          </span>
        </nav>

        {/* Right: Mode Toggle Button + Filled CTA Button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          {/* Mode Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            style={{
              background: colors.surfaceCard2,
              color: colors.accent,
              border: colors.border,
              borderRadius: "5px",
              padding: "7px 14px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
            title="Toggle Light / Dark Mode"
          >
            <span>{isDark ? "🌙" : "☀️"}</span>
            <span>{isDark ? "Dark Mode" : "Light Mode"}</span>
          </button>

          {/* Filled CTA Button */}
          {connected ? (
            <button
              type="button"
              onClick={handleDisconnect}
              style={{
                backgroundColor: colors.surfaceCard2,
                color: colors.accent,
                border: colors.border,
                borderRadius: "5px",
                padding: "8px 18px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              Disconnect
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConnect}
              disabled={loading}
              style={{
                backgroundColor: colors.accent,
                color: colors.btnFilledText,
                border: "none",
                borderRadius: "5px",
                padding: "8px 18px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {loading ? "Connecting..." : "Connect Server"}
            </button>
          )}
        </div>
      </header>

      {/* 2. HERO SECTION: Two-Column Layout */}
      <section
        style={{
          maxWidth: 1120,
          width: "100%",
          margin: "0 auto",
          padding: "48px 32px 36px",
          display: "grid",
          gridTemplateColumns: "1.2fr 0.8fr",
          gap: 40,
          alignItems: "center",
          boxSizing: "border-box",
        }}
      >
        {/* Hero Left Column */}
        <div>
          {/* Eyebrow Badge */}
          <span
            style={{
              display: "inline-block",
              backgroundColor: colors.badgeBg,
              color: colors.badgeText,
              border: colors.border,
              borderRadius: "5px",
              padding: "4px 12px",
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 14,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
            }}
          >
            Model Context Protocol Debugger
          </span>

          {/* Large Serif Headline */}
          <h1
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 44,
              lineHeight: 1.15,
              fontWeight: 700,
              color: colors.textHeading,
              margin: "0 0 16px 0",
              letterSpacing: "-1px",
            }}
          >
            Live Inspection, Replay & Compliance.
          </h1>

          {/* Short Body Copy */}
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.6,
              color: colors.textBody,
              margin: "0 0 28px 0",
              maxWidth: 480,
            }}
          >
            Inspect MCP server tools, send schema-validated requests, monitor millisecond-level latency,
            and replay sessions to prevent regressions.
          </p>

          {/* Two Buttons: Filled + Outlined */}
          <div style={{ display: "flex", gap: 14 }}>
            <button
              type="button"
              onClick={connected ? handleSaveSession : handleConnect}
              style={{
                backgroundColor: colors.accent,
                color: colors.btnFilledText,
                border: "none",
                borderRadius: "5px",
                padding: "11px 24px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {connected ? "💾 Save Session" : "▶ Start Inspection"}
            </button>
            <button
              type="button"
              onClick={handleOpenReplay}
              style={{
                backgroundColor: "transparent",
                color: colors.btnOutlineText,
                border: colors.btnOutlineBorder,
                borderRadius: "5px",
                padding: "11px 22px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              🔄 Replay Sessions
            </button>
          </div>
        </div>

        {/* Hero Right Column: Solid-Color Block containing Plain Circle Graphic */}
        <div
          style={{
            backgroundColor: colors.placeholderBlock,
            border: colors.border,
            borderRadius: "5px",
            aspectRatio: "1.1 / 1",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            maxWidth: 380,
            margin: "0 auto",
            padding: 24,
            boxSizing: "border-box",
            position: "relative",
          }}
        >
          {/* Plain Circle Graphic as Placeholder */}
          <div
            style={{
              width: 110,
              height: 110,
              borderRadius: "50%",
              backgroundColor: colors.circleGraphic,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: colors.btnFilledText,
              fontFamily: "'Fraunces', serif",
              fontSize: 22,
              fontWeight: 700,
              marginBottom: 16,
            }}
          >
            {connected ? "✓" : "MCP"}
          </div>

          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: colors.textHeading,
              textAlign: "center",
              fontFamily: "'Fraunces', serif",
            }}
          >
            {connected ? `${serverInfo?.name} (v${serverInfo?.version})` : "No Server Connected"}
          </div>

          <div
            style={{
              fontSize: 12,
              color: colors.textBody,
              textAlign: "center",
              marginTop: 4,
            }}
          >
            {connected ? `${tools.length} Tools Available &bull; ${events.length} Events` : "Click Connect below to attach server"}
          </div>
        </div>
      </section>

      {/* 3. THREE-COLUMN FEATURE CARD GRID (Alternating between two card background tones) */}
      <section
        style={{
          maxWidth: 1120,
          width: "100%",
          margin: "0 auto",
          padding: "0 32px 36px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
          }}
        >
          {/* Card 1: Tone 1 (SurfaceCard1) */}
          <div
            style={{
              backgroundColor: colors.surfaceCard1,
              border: colors.border,
              borderRadius: "5px",
              padding: "24px 22px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ color: colors.accent, fontSize: 20 }}>🔍</div>
            <h3
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: 17,
                fontWeight: 600,
                color: colors.textHeading,
                margin: 0,
              }}
            >
              Discovered Tools ({tools.length})
            </h3>
            <p
              style={{
                fontSize: 13,
                lineHeight: 1.5,
                color: colors.textBody,
                margin: 0,
              }}
            >
              Introspects list_tools, validates JSON schemas, and prepares schema input forms.
            </p>
          </div>

          {/* Card 2: Tone 2 (SurfaceCard2 Alternating tone) */}
          <div
            style={{
              backgroundColor: colors.surfaceCard2,
              border: colors.border,
              borderRadius: "5px",
              padding: "24px 22px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ color: colors.accent, fontSize: 20 }}>⚡</div>
            <h3
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: 17,
                fontWeight: 600,
                color: colors.textHeading,
                margin: 0,
              }}
            >
              P50 Latency ({p50Latency}ms)
            </h3>
            <p
              style={{
                fontSize: 13,
                lineHeight: 1.5,
                color: colors.textBody,
                margin: 0,
              }}
            >
              Records millisecond-accurate request/response timing for performance tracking.
            </p>
          </div>

          {/* Card 3: Tone 1 (SurfaceCard1) */}
          <div
            style={{
              backgroundColor: colors.surfaceCard1,
              border: colors.border,
              borderRadius: "5px",
              padding: "24px 22px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ color: colors.accent, fontSize: 20 }}>🔄</div>
            <h3
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: 17,
                fontWeight: 600,
                color: colors.textHeading,
                margin: 0,
              }}
            >
              Session Replay & Bench
            </h3>
            <p
              style={{
                fontSize: 13,
                lineHeight: 1.5,
                color: colors.textBody,
                margin: 0,
              }}
            >
              Replay recorded sessions against servers to detect breaking changes and regressions.
            </p>
          </div>
        </div>
      </section>

      {/* 4. WORKSPACE CONTROLS & THREE-COLUMN MCP STUDIO */}
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
        {/* Server Connection Bar */}
        <div
          style={{
            backgroundColor: colors.surfaceCard1,
            border: colors.border,
            borderRadius: "5px",
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                style={{
                  backgroundColor: transport === "stdio" ? colors.accent : colors.surfaceCard2,
                  color: transport === "stdio" ? colors.btnFilledText : colors.accent,
                  border: colors.border,
                  borderRadius: "5px",
                  padding: "5px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onClick={() => setTransport("stdio")}
              >
                stdio
              </button>
              <button
                type="button"
                style={{
                  backgroundColor: transport === "http" ? colors.accent : colors.surfaceCard2,
                  color: transport === "http" ? colors.btnFilledText : colors.accent,
                  border: colors.border,
                  borderRadius: "5px",
                  padding: "5px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onClick={() => setTransport("http")}
              >
                HTTP / SSE
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: colors.textBody }}>
              <span>Quick Presets:</span>
              <button
                type="button"
                style={{
                  backgroundColor: colors.surfaceCard2,
                  color: colors.accent,
                  border: colors.border,
                  borderRadius: "5px",
                  padding: "3px 8px",
                  cursor: "pointer",
                  fontSize: 11,
                }}
                onClick={() => {
                  setTransport("stdio");
                  setCommand("node examples/math-server/dist/index.js");
                }}
                disabled={connected}
              >
                Math Calculator
              </button>
              <button
                type="button"
                style={{
                  backgroundColor: colors.surfaceCard2,
                  color: colors.accent,
                  border: colors.border,
                  borderRadius: "5px",
                  padding: "3px 8px",
                  cursor: "pointer",
                  fontSize: 11,
                }}
                onClick={() => {
                  setTransport("stdio");
                  setCommand("npx @modelcontextprotocol/server-filesystem .");
                }}
                disabled={connected}
              >
                Filesystem
              </button>
              <button
                type="button"
                style={{
                  backgroundColor: colors.surfaceCard2,
                  color: colors.accent,
                  border: colors.border,
                  borderRadius: "5px",
                  padding: "3px 8px",
                  cursor: "pointer",
                  fontSize: 11,
                }}
                onClick={() => {
                  setTransport("http");
                  setHttpUrl("http://localhost:8000/mcp");
                }}
                disabled={connected}
              >
                Remote HTTP
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            {transport === "stdio" ? (
              <input
                style={{
                  flex: 1,
                  backgroundColor: colors.inputBg,
                  border: colors.border,
                  color: colors.textHeading,
                  padding: "8px 12px",
                  borderRadius: "5px",
                  fontSize: 13,
                  fontFamily: "monospace",
                  outline: "none",
                }}
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="Command (e.g. node examples/math-server/dist/index.js)"
                disabled={connected}
              />
            ) : (
              <input
                style={{
                  flex: 1,
                  backgroundColor: colors.inputBg,
                  border: colors.border,
                  color: colors.textHeading,
                  padding: "8px 12px",
                  borderRadius: "5px",
                  fontSize: 13,
                  fontFamily: "monospace",
                  outline: "none",
                }}
                value={httpUrl}
                onChange={(e) => setHttpUrl(e.target.value)}
                placeholder="Server URL (e.g. http://localhost:8000/mcp)"
                disabled={connected}
              />
            )}

            {connected ? (
              <button
                type="button"
                onClick={handleDisconnect}
                style={{
                  backgroundColor: colors.surfaceCard2,
                  color: colors.accent,
                  border: colors.border,
                  borderRadius: "5px",
                  padding: "8px 20px",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                Disconnect
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConnect}
                disabled={loading}
                style={{
                  backgroundColor: colors.accent,
                  color: colors.btnFilledText,
                  border: "none",
                  borderRadius: "5px",
                  padding: "8px 20px",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                {loading ? "Connecting..." : "Connect"}
              </button>
            )}
          </div>
        </div>

        {/* 3-Column Studio Workspace Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "280px 1fr 320px",
            gap: 16,
            minHeight: 520,
          }}
        >
          {/* Column 1: Tools Explorer */}
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
            <div
              style={{
                padding: "12px 16px",
                borderBottom: colors.border,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 14, color: colors.textHeading }}>
                Tools ({filteredTools.length})
              </span>
              <input
                style={{
                  backgroundColor: colors.inputBg,
                  border: colors.border,
                  color: colors.textHeading,
                  padding: "3px 6px",
                  borderRadius: "4px",
                  fontSize: 11,
                  outline: "none",
                  width: 90,
                }}
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
              {filteredTools.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: colors.textBody, fontSize: 12 }}>
                  {connected ? "No tools found" : "Connect server to view tools"}
                </div>
              ) : (
                filteredTools.map((t) => {
                  const isSelected = selectedTool?.name === t.name;
                  return (
                    <div
                      key={t.name}
                      onClick={() => selectTool(t)}
                      style={{
                        backgroundColor: isSelected ? colors.surfaceCard2 : colors.bg,
                        border: isSelected ? `1px solid ${colors.accent}` : colors.border,
                        padding: 10,
                        borderRadius: "5px",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: 600, color: colors.accent, fontSize: 13 }}>{t.name}</span>
                        <span
                          style={{
                            fontSize: 10,
                            backgroundColor: colors.surfaceCard1,
                            color: colors.textBody,
                            padding: "1px 5px",
                            borderRadius: "3px",
                            border: colors.border,
                          }}
                        >
                          {Object.keys(t.inputSchema?.properties || {}).length} args
                        </span>
                      </div>
                      {t.description && (
                        <div style={{ fontSize: 11, color: colors.textBody, marginTop: 4 }}>
                          {t.description}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Column 2: Tool Runner & Schema Form */}
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
                  onClick={handleInvoke}
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

            <div style={{ flex: 1, overflowY: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
              {selectedTool ? (
                <>
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

                  {/* Output Result */}
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
                      {!toolResult.success && (
                        <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            onClick={() => handleDiagnose(selectedTool, toolArgs, toolResult.error)}
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

          {/* Column 3: Live Session Timeline */}
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
            <div
              style={{
                padding: "12px 16px",
                borderBottom: colors.border,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 14, color: colors.textHeading }}>
                Live Events ({events.length})
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  style={{
                    background: "none",
                    border: "none",
                    color: colors.accent,
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                  onClick={handleExportJsonl}
                  disabled={events.length === 0}
                >
                  Export
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 10, display: "flex", flexDirection: "column", gap: 6 }}>
              {events.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: colors.textBody, fontSize: 12 }}>
                  No events recorded yet.
                </div>
              ) : (
                events.map((ev, i) => {
                  const isReq = ev.type === "request";
                  const isRes = ev.type === "response";
                  const isErr = ev.type === "error" || (isRes && ev.error);

                  return (
                    <div
                      key={i}
                      onClick={() => setSelectedEvent(ev)}
                      style={{
                        backgroundColor: selectedEvent === ev ? colors.surfaceCard2 : colors.bg,
                        borderLeft: `3px solid ${isErr ? colors.accent : isReq ? colors.textHeading : colors.accent}`,
                        borderTop: colors.border,
                        borderRight: colors.border,
                        borderBottom: colors.border,
                        padding: 8,
                        borderRadius: "0 4px 4px 0",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: colors.accent }}>{ev.type.toUpperCase()}</span>
                        <span style={{ fontSize: 10, color: colors.textBody }}>
                          {new Date(ev.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: colors.textHeading }}>
                        {isReq && <strong>{ev.method} (#{ev.id})</strong>}
                        {isRes && (
                          <span>
                            Res #{ev.id} &bull; <span style={{ color: colors.accent, fontWeight: 600 }}>{ev.latencyMs}ms</span>
                          </span>
                        )}
                        {ev.type === "notification" && <span>Notif: {ev.method}</span>}
                        {ev.type === "error" && <span>Error: {ev.message}</span>}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={eventEndRef} />
            </div>

            {/* Selected Event Inspector */}
            {selectedEvent && (
              <div
                style={{
                  height: 150,
                  borderTop: colors.border,
                  backgroundColor: colors.bg,
                  padding: 8,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 600, marginBottom: 4, color: colors.textHeading }}>
                  <span>Event Inspector</span>
                  <button
                    type="button"
                    style={{ background: "none", border: "none", color: colors.textBody, cursor: "pointer", fontSize: 12 }}
                    onClick={() => setSelectedEvent(null)}
                  >
                    ✕
                  </button>
                </div>
                <pre
                  style={{
                    flex: 1,
                    margin: 0,
                    backgroundColor: colors.inputBg,
                    border: colors.border,
                    padding: 6,
                    borderRadius: "4px",
                    fontSize: 10,
                    fontFamily: "monospace",
                    color: colors.textHeading,
                    overflowY: "auto",
                  }}
                >
                  {JSON.stringify(selectedEvent, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SESSION REPLAY MODAL */}
      {showReplayModal && (
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
                onClick={() => {
                  setShowReplayModal(false);
                  setReplayResults(null);
                }}
              >
                ✕
              </button>
            </div>

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
                          {s.events.length} events &bull; ID: {s.id.slice(0, 8)}...
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRunReplay(s.id)}
                        disabled={replaying}
                        style={{
                          backgroundColor: colors.accent,
                          color: colors.btnFilledText,
                          border: "none",
                          padding: "6px 14px",
                          borderRadius: "5px",
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {replaying ? "Replaying..." : "Replay"}
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Replay Diff Results */}
              {replayResults && (
                <div style={{ marginTop: 14, borderTop: colors.border, paddingTop: 14 }}>
                  <h4 style={{ margin: "0 0 10px 0", color: colors.textHeading, fontFamily: "'Fraunces', serif" }}>
                    Diff Results
                  </h4>
                  {replayResults.map((r, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: colors.surfaceCard2,
                        border: colors.border,
                        padding: 12,
                        borderRadius: "5px",
                        marginBottom: 10,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 13, color: colors.textHeading }}>
                          Tool: <strong>{r.toolName}</strong>
                        </span>
                        <span style={{ color: colors.accent, fontWeight: 700, fontSize: 12 }}>
                          {r.matched ? "✓ MATCHED" : "⚠️ OUTPUT CHANGED"}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: colors.textBody, marginBottom: 8 }}>
                        Original: {r.originalLatencyMs}ms &rarr; Replayed: {r.replayedLatencyMs}ms ({r.replayedLatencyMs - r.originalLatencyMs >= 0 ? "+" : ""}{r.replayedLatencyMs - r.originalLatencyMs}ms)
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <pre
                          style={{
                            margin: 0,
                            backgroundColor: colors.inputBg,
                            border: colors.border,
                            padding: 8,
                            borderRadius: "5px",
                            fontSize: 11,
                            maxHeight: 120,
                            overflowY: "auto",
                            color: colors.textHeading,
                          }}
                        >
                          {JSON.stringify(r.originalResponse, null, 2)}
                        </pre>
                        <pre
                          style={{
                            margin: 0,
                            backgroundColor: colors.inputBg,
                            border: colors.border,
                            padding: 8,
                            borderRadius: "5px",
                            fontSize: 11,
                            maxHeight: 120,
                            overflowY: "auto",
                            color: colors.textHeading,
                          }}
                        >
                          {JSON.stringify(r.replayedResponse || r.replayedError, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI DIAGNOSTIC COPILOT MODAL */}
      {showDiagnosticModal && (
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
                onClick={() => {
                  setShowDiagnosticModal(false);
                  setDiagnostic(null);
                }}
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
                          onClick={() => handleApplyFix(diagnostic.correctedArgs)}
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
      )}
    </div>
  );
}

// Mount React Root
if (typeof window !== "undefined") {
  const rootEl = document.getElementById("root");
  if (rootEl) {
    ReactDOM.createRoot(rootEl).render(
      <React.StrictMode>
        <InspectorUI apiUrl={window.location.port === "5173" ? "http://localhost:3000" : window.location.origin} />
      </React.StrictMode>
    );
  }
}
