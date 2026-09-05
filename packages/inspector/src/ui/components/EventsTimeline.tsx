import React from "react";
import { ThemeColors, EventItem, ToolDef } from "../types.js";

interface EventsTimelineProps {
  colors: ThemeColors;
  events: EventItem[];
  selectedEvent: EventItem | null;
  setSelectedEvent: (ev: EventItem | null) => void;
  onExportJsonl: () => void;
  eventEndRef: React.RefObject<HTMLDivElement>;
  onDiagnose: (tool: ToolDef | null, args: any, error: any) => void;
  selectedTool: ToolDef | null;
  toolArgs: Record<string, any>;
  diagnosing: boolean;
}

export function EventsTimeline({
  colors,
  events,
  selectedEvent,
  setSelectedEvent,
  onExportJsonl,
  eventEndRef,
  onDiagnose,
  selectedTool,
  toolArgs,
  diagnosing,
}: EventsTimelineProps) {
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
      {/* Header */}
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
          onClick={onExportJsonl}
          disabled={events.length === 0}
        >
          Export JSONL
        </button>
      </div>

      {/* Events List */}
      <div style={{ flex: 1, overflowY: "auto", padding: 10, display: "flex", flexDirection: "column", gap: 6 }}>
        {events.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: colors.textBody, fontSize: 12 }}>
            No events recorded yet. Connect to a server to see live JSON-RPC telemetry.
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
                <div style={{ fontSize: 12, fontWeight: 600, color: colors.textHeading }}>
                  {isReq ? ev.method : isRes ? (ev.error ? "Error Response" : "Success Result") : ev.type}
                </div>
                {ev.latencyMs !== undefined && (
                  <div style={{ fontSize: 10, color: colors.accent, marginTop: 2 }}>
                    ⏱ {ev.latencyMs} ms
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={eventEndRef} />
      </div>

      {/* Selected Event Details Inspector */}
      {selectedEvent && (
        <div
          style={{
            borderTop: colors.border,
            padding: 10,
            maxHeight: 180,
            backgroundColor: colors.surfaceCard2,
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
          {(selectedEvent.type === "error" || (selectedEvent.type === "response" && selectedEvent.error)) && (
            <div style={{ marginTop: 6, display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => onDiagnose(selectedTool, selectedEvent.params || toolArgs, selectedEvent.error || selectedEvent.message)}
                disabled={diagnosing}
                style={{
                  backgroundColor: colors.surfaceCard2,
                  color: colors.accent,
                  border: `1px solid ${colors.accent}`,
                  borderRadius: "4px",
                  padding: "4px 10px",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                ✨ Diagnose Event with AI
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
