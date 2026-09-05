import React from "react";
import { ThemeColors, ThemeMode, ServerInfo } from "../types.js";

interface NavbarProps {
  colors: ThemeColors;
  theme: ThemeMode;
  toggleTheme: () => void;
  connected: boolean;
  serverInfo: ServerInfo | null;
  onOpenReplay: () => void;
  onSaveSession: () => void;
  sessionId: string | null;
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
}: NavbarProps) {
  return (
    <header
      style={{
        borderBottom: colors.border,
        backgroundColor: colors.surfaceCard1,
        padding: "0 32px",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Brand Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          style={{
            fontFamily: "'Fraunces', serif",
            fontWeight: 700,
            fontSize: 22,
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
            padding: "2px 8px",
            borderRadius: "4px",
            letterSpacing: "0.5px",
          }}
        >
          v0.1.0
        </span>
      </div>

      {/* Navigation Links */}
      <nav style={{ display: "flex", gap: 24, fontSize: 13, fontWeight: 500 }}>
        <a href="#workspace" style={{ color: colors.textBody, textDecoration: "none" }}>
          Workspace
        </a>
        <a href="#features" style={{ color: colors.textBody, textDecoration: "none" }}>
          Capabilities
        </a>
        <a
          href="https://github.com/maheshsingh20/YumDee-MCP-Studio"
          target="_blank"
          rel="noreferrer"
          style={{ color: colors.textBody, textDecoration: "none" }}
        >
          GitHub
        </a>
      </nav>

      {/* Action Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {connected && sessionId && (
          <button
            type="button"
            onClick={onSaveSession}
            style={{
              backgroundColor: colors.surfaceCard2,
              color: colors.accent,
              border: colors.border,
              borderRadius: "5px",
              padding: "6px 12px",
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
            padding: "6px 12px",
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
            padding: "6px 12px",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>

        {/* Connection Status Pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            backgroundColor: colors.surfaceCard2,
            border: colors.border,
            padding: "5px 12px",
            borderRadius: "5px",
            fontSize: 12,
            fontWeight: 500,
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
