import React from "react";
import { ThemeColors, ThemeMode, ServerInfo, ViewMode } from "../types.js";

interface NavbarProps {
  colors: ThemeColors;
  theme: ThemeMode;
  toggleTheme: () => void;
  connected: boolean;
  serverInfo: ServerInfo | null;
  onOpenReplay: () => void;
  onSaveSession: () => void;
  sessionId: string | null;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onOpenAiSettings: () => void;
  hasAiKey: boolean;
}

export function Navbar({
  colors,
  theme,
  toggleTheme,
  connected,
  serverInfo,
  onOpenReplay,
  onSaveSession,
  sessionId,
  viewMode,
  setViewMode,
  onOpenAiSettings,
  hasAiKey,
}: NavbarProps) {
  return (
    <header
      style={{
        borderBottom: colors.border,
        backgroundColor: colors.surfaceCard1,
        padding: "0 28px",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
        gap: 16,
      }}
    >
      {/* Brand Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <span
          style={{
            fontFamily: "'Fraunces', serif",
            fontWeight: 700,
            fontSize: 21,
            letterSpacing: "-0.5px",
            color: colors.accent,
          }}
        >
          YumDee MCP Studio
        </span>
        <span
          style={{
            backgroundColor: colors.badgeBg,
            color: colors.badgeText,
            fontSize: 10,
            fontWeight: 700,
            padding: "2px 7px",
            borderRadius: "4px",
            letterSpacing: "0.5px",
          }}
        >
          v0.3.0
        </span>
      </div>

      {/* Center View Mode Switcher Tabs */}
      <div
        style={{
          display: "flex",
          backgroundColor: colors.surfaceCard2,
          border: colors.border,
          borderRadius: "6px",
          padding: 3,
          gap: 2,
        }}
      >
        <button
          type="button"
          onClick={() => setViewMode("inspector")}
          style={{
            padding: "6px 14px",
            borderRadius: "4px",
            border: "none",
            backgroundColor: viewMode === "inspector" ? colors.accent : "transparent",
            color: viewMode === "inspector" ? colors.btnFilledText : colors.textHeading,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "all 0.15s ease",
          }}
        >
          <span>🔍</span>
          <span>Inspector</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode("agent")}
          style={{
            padding: "6px 14px",
            borderRadius: "4px",
            border: "none",
            backgroundColor: viewMode === "agent" ? colors.accent : "transparent",
            color: viewMode === "agent" ? colors.btnFilledText : colors.textHeading,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "all 0.15s ease",
          }}
        >
          <span>🤖</span>
          <span>Agent Playground</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode("audit")}
          style={{
            padding: "6px 14px",
            borderRadius: "4px",
            border: "none",
            backgroundColor: viewMode === "audit" ? colors.accent : "transparent",
            color: viewMode === "audit" ? colors.btnFilledText : colors.textHeading,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "all 0.15s ease",
          }}
        >
          <span>🛡️</span>
          <span>Security Audit</span>
        </button>
      </div>

      {/* Action Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {/* AI Settings Button */}
        <button
          type="button"
          onClick={onOpenAiSettings}
          title="Configure Google Gemini API Key & Models"
          style={{
            backgroundColor: colors.surfaceCard2,
            color: colors.textHeading,
            border: colors.border,
            borderRadius: "5px",
            padding: "6px 12px",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span>⚙️ AI Settings</span>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: hasAiKey ? "#10B981" : "#F59E0B",
            }}
            title={hasAiKey ? "Gemini Key Configured" : "Zero-Key Heuristic Active"}
          />
        </button>

        {connected && sessionId && (
          <button
            type="button"
            onClick={onSaveSession}
            style={{
              backgroundColor: colors.surfaceCard2,
              color: colors.accent,
              border: colors.border,
              borderRadius: "5px",
              padding: "6px 10px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Save Session
          </button>
        )}

        <button
          type="button"
          onClick={onOpenReplay}
          style={{
            backgroundColor: colors.surfaceCard2,
            color: colors.accent,
            border: colors.border,
            borderRadius: "5px",
            padding: "6px 10px",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Replay Diff
        </button>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          style={{
            backgroundColor: colors.surfaceCard2,
            color: colors.textHeading,
            border: colors.border,
            borderRadius: "5px",
            padding: "6px 10px",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          {theme === "light" ? "🌙" : "☀️"}
        </button>

        {/* Connection Status Pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            backgroundColor: colors.surfaceCard2,
            border: colors.border,
            padding: "5px 10px",
            borderRadius: "5px",
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              backgroundColor: connected ? "#10B981" : "#EF4444",
            }}
          />
          <span style={{ color: colors.textHeading }}>
            {connected ? serverInfo?.name || "Connected" : "Disconnected"}
          </span>
        </div>
      </div>
    </header>
  );
}
