import React from "react";
import { ThemeColors } from "../types.js";

interface FeatureGridProps {
  colors: ThemeColors;
}

export function FeatureGrid({ colors }: FeatureGridProps) {
  const features = [
    {
      tone: colors.cardToneA,
      icon: "🔍",
      title: "Live Introspection & Stream",
      description: "Inspect tools, resources, and prompts over stdio and HTTP with real-time Server-Sent Events.",
    },
    {
      tone: colors.cardToneB,
      icon: "⚡",
      title: "Replay & Regression Diffing",
      description: "Capture complete sessions to standardized McpSession JSON and replay with side-by-side output diffs.",
    },
    {
      tone: colors.cardToneA,
      icon: "🧠",
      title: "Semantic Routing & AI Copilot",
      description: "Dynamically prune prompt context by 80% with vector routing and auto-patch failed tool calls.",
    },
  ];

  return (
    <section
      id="features"
      style={{
        maxWidth: 1120,
        width: "100%",
        margin: "0 auto",
        padding: "0 32px 40px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
        }}
      >
        {features.map((f, i) => (
          <div
            key={i}
            style={{
              backgroundColor: f.tone,
              border: colors.border,
              borderRadius: "5px",
              padding: "20px 22px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 22 }}>{f.icon}</span>
            <h3
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: 16,
                fontWeight: 600,
                color: colors.textHeading,
                margin: "4px 0 0 0",
              }}
            >
              {f.title}
            </h3>
            <p
              style={{
                fontSize: 13,
                lineHeight: 1.5,
                color: colors.textBody,
                margin: 0,
              }}
            >
              {f.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
