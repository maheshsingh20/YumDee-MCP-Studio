import { useState, useEffect, useRef } from "react";
import {
  ThemeMode,
  ToolDef,
  ServerInfo,
  EventItem,
  DiagnosticResult,
  ReplayItem,
} from "../types.js";

export interface UseInspectorOptions {
  apiUrl?: string;
}

export function useInspector({ apiUrl = "http://localhost:3000" }: UseInspectorOptions = {}) {
  const [theme, setTheme] = useState<ThemeMode>("light");
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
  const [replayResults, setReplayResults] = useState<ReplayItem[] | null>(null);
  const [replaying, setReplaying] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);
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

      setConnected(true);
      setSessionId(data.sessionId);
      setServerInfo(data.serverInfo);
      setTools(data.tools || []);
      if (data.tools && data.tools.length > 0) {
        selectTool(data.tools[0]);
      }
      showNotification(`Connected to ${data.serverInfo.name} v${data.serverInfo.version}`);
    } catch (err: any) {
      alert("Failed to connect: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!sessionId) return;
    try {
      await fetch(`${apiUrl}/api/servers/disconnect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      setConnected(false);
      setSessionId(null);
      setServerInfo(null);
      setTools([]);
      setSelectedTool(null);
      showNotification("Disconnected from server");
    } catch (err: any) {
      alert("Failed to disconnect: " + err.message);
    }
  };

  const selectTool = (tool: ToolDef) => {
    setSelectedTool(tool);
    setToolResult(null);
    const initialArgs: Record<string, any> = {};
    if (tool.inputSchema?.properties) {
      for (const [k, v] of Object.entries(tool.inputSchema.properties)) {
        if (v.type === "number") initialArgs[k] = 10;
        else if (v.type === "string") initialArgs[k] = "";
        else initialArgs[k] = "";
      }
    }
    setToolArgs(initialArgs);
  };

  const handleInvoke = async () => {
    if (!selectedTool || !sessionId) return;
    setInvoking(true);
    setToolResult(null);

    try {
      const parsedArgs: Record<string, any> = {};
      for (const [k, v] of Object.entries(toolArgs)) {
        const propType = selectedTool.inputSchema?.properties?.[k]?.type;
        if (propType === "number") {
          parsedArgs[k] = v === "" ? 0 : Number(v);
        } else {
          parsedArgs[k] = v;
        }
      }

      const res = await fetch(`${apiUrl}/api/servers/${sessionId}/invoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolName: selectedTool.name,
          arguments: parsedArgs,
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
      (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return {
    theme,
    toggleTheme,
    transport,
    setTransport,
    command,
    setCommand,
    httpUrl,
    setHttpUrl,
    connected,
    loading,
    sessionId,
    serverInfo,
    tools,
    filteredTools,
    selectedTool,
    selectTool,
    toolArgs,
    setToolArgs,
    toolResult,
    invoking,
    events,
    selectedEvent,
    setSelectedEvent,
    searchTerm,
    setSearchTerm,
    savedSessions,
    showReplayModal,
    setShowReplayModal,
    replayResults,
    replaying,
    statusMessage,
    diagnostic,
    diagnosing,
    showDiagnosticModal,
    setShowDiagnosticModal,
    eventEndRef,
    handleConnect,
    handleDisconnect,
    handleInvoke,
    handleSaveSession,
    handleOpenReplay,
    handleRunReplay,
    handleDiagnose,
    handleApplyFix,
    handleExportJsonl,
  };
}
