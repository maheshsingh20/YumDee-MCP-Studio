import React from "react";
import { ThemeColors, ServerInfo, ToolDef } from "../types.js";

interface HeroProps {
  colors: ThemeColors;
  connected: boolean;
  serverInfo: ServerInfo | null;
  tools: ToolDef[];
  eventsCount: number;
}

export function Hero({ colors, connected, serverInfo, tools, eventsCount }: HeroProps) {
  return (
    <section
      style={{
        maxWidth: 1120,
        width: "100%",
        margin: "0 auto",
        padding: "48px 32px 36px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 0.8fr",
          gap: 40,
          alignItems: "center",
        }}
      >
        {/* Left Column: Content */}
        <div>
          <span
            style={{
              display: "inline-block",
              backgroundColor: colors.badgeBg,
              color: colors.badgeText,
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "1px",
              padding: "4px 10px",
              borderRadius: "4px",
              marginBottom: 16,
            }}
          >
            MODEL CONTEXT PROTOCOL
          </span>

          <h1
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 38,
              lineHeight: 1.15,
              fontWeight: 700,
              color: colors.textHeading,
              margin: "0 0 16px 0",
              letterSpacing: "-0.5px",
            }}
          >
            Inspect, benchmark, and orchestrate MCP servers with precision.
          </h1>

          <p
            style={{
              fontSize: 15,
              lineHeight: 1.6,
              color: colors.textBody,
              margin: "0 0 24px 0",
              maxWidth: 520,
            }}
          >
            The open-source TypeScript studio for the Model Context Protocol. Live JSON-RPC inspection,
            deterministic session replay diffing, and automated spec compliance benchmarking.
          </p>

          <div style={{ display: "flex", gap: 12 }}>
            <a
              href="#workspace"
              style={{
                backgroundColor: colors.btnFilledBg,
                color: colors.btnFilledText,
                border: "none",
                borderRadius: "5px",
                padding: "10px 20px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Launch Workspace
            </a>
            <a
              href="https://github.com/maheshsingh20/YumDee-MCP-Studio#readme"
              target="_blank"
              rel="noreferrer"
              style={{
                backgroundColor: "transparent",
                color: colors.btnOutlinedText,
                border: colors.btnOutlinedBorder,
                borderRadius: "5px",
                padding: "10px 20px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              View Documentation
            </a>
          </div>
        </div>

        {/* Right Column: Solid-color block with plain circle graphic placeholder */}
        <div
          style={{
            backgroundColor: colors.cardToneB,
            border: colors.border,
            borderRadius: "5px",
            height: 260,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Plain circle graphic as placeholder */}
          <div
            style={{
              width: 130,
              height: 130,
              borderRadius: "50%",
              backgroundColor: colors.accent,
              opacity: 0.85,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: colors.btnFilledText,
              fontFamily: "'Fraunces', serif",
              fontSize: 13,
              fontWeight: 600,
              textAlign: "center",
              padding: 12,
              boxSizing: "border-box",
            }}
          >
            {connected ? (
              <div>
                <div style={{ fontSize: 16 }}>● Active</div>
                <div style={{ fontSize: 11, opacity: 0.9 }}>{tools.length} Tools</div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 15 }}>Ready</div>
                <div style={{ fontSize: 10, opacity: 0.8 }}>to connect</div>
              </div>
            )}
          </div>

          <div
            style={{
              position: "absolute",
              bottom: 12,
              left: 16,
              right: 16,
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11,
              color: colors.textBody,
            }}
          >
            <span>Protocol: 2024-11-05</span>
            <span>{connected ? `${eventsCount} events tracked` : "Standby"}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
