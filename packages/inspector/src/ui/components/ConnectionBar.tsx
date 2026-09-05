import React from "react";
import { ThemeColors } from "../types.js";

interface ConnectionBarProps {
  colors: ThemeColors;
  transport: "stdio" | "http";
  setTransport: (t: "stdio" | "http") => void;
  command: string;
  setCommand: (c: string) => void;
  httpUrl: string;
  setHttpUrl: (u: string) => void;
  connected: boolean;
  loading: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function ConnectionBar({
  colors,
  transport,
  setTransport,
  command,
  setCommand,
  httpUrl,
  setHttpUrl,
  connected,
  loading,
  onConnect,
  onDisconnect,
}: ConnectionBarProps) {
  const presets = [
    {
      label: "Math Calculator",
      transport: "stdio" as const,
      cmd: "node examples/math-server/dist/index.js",
    },
    {
      label: "🌐 Official Reference (npm)",
      transport: "stdio" as const,
      cmd: "npx -y @modelcontextprotocol/server-everything",
    },
    {
      label: "Filesystem",
      transport: "stdio" as const,
      cmd: "npx -y @modelcontextprotocol/server-filesystem .",
    },
    {
      label: "Memory Graph",
      transport: "stdio" as const,
      cmd: "npx -y @modelcontextprotocol/server-memory",
    },
    {
      label: "Remote HTTP",
      transport: "http" as const,
      cmd: "http://localhost:8000/mcp",
    },
  ];

  return (
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
      {/* Top row: Transport Toggle & Quick Presets */}
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

        {/* Quick Presets */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: colors.textBody }}>
          <span>Quick Presets:</span>
          {presets.map((p, i) => (
            <button
              key={i}
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
                setTransport(p.transport);
                if (p.transport === "stdio") setCommand(p.cmd);
                else setHttpUrl(p.cmd);
              }}
              disabled={connected}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom row: Input Command / URL & Connect Button */}
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
              outline: "none",
            }}
            placeholder="Command to launch server (e.g. node server.js or npx -y @modelcontextprotocol/server-everything)"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
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
              outline: "none",
            }}
            placeholder="Remote server endpoint URL (e.g. http://localhost:8000/mcp)"
            value={httpUrl}
            onChange={(e) => setHttpUrl(e.target.value)}
            disabled={connected}
          />
        )}

        {connected ? (
          <button
            type="button"
            onClick={onDisconnect}
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
            onClick={onConnect}
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
  );
}
