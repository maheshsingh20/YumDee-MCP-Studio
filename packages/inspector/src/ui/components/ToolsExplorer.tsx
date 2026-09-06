import React from "react";
import { ThemeColors, ToolDef } from "../types.js";

interface ToolsExplorerProps {
  colors: ThemeColors;
  filteredTools: ToolDef[];
  selectedTool: ToolDef | null;
  selectTool: (t: ToolDef) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  connected: boolean;
}

export function ToolsExplorer({
  colors,
  filteredTools,
  selectedTool,
  selectTool,
  searchTerm,
  setSearchTerm,
  connected,
}: ToolsExplorerProps) {
  return (
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
      {/* Header & Search */}
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

      {/* Tools List */}
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
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span
                      title="Remote server tool"
                      style={{
                        fontSize: 9,
                        color: colors.textBody,
                        backgroundColor: colors.surfaceCard1,
                        padding: "1px 4px",
                        borderRadius: "3px",
                        border: colors.border,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Remote
                    </span>
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
                </div>
                {t.description && (
                  <div
                    style={{
                      fontSize: 11,
                      color: colors.textBody,
                      marginTop: 4,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={t.description}
                  >
                    {t.description}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
