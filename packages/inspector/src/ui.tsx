/**
 * Inspector Web UI - React Components
 *
 * Rendered in the browser; communicates with the backend via REST + WebSocket
 */

import React from "react";
import ReactDOM from "react-dom/client";

export interface InspectorUIProps {
  apiUrl: string;
}

/**
 * Root component for the Inspector UI
 *
 * TODO: Implement with React
 * - Connection panel (connect to server)
 * - Tools list (display available tools)
 * - Tool invocation form (call tools with schema-based inputs)
 * - Session recorder (start/stop recording)
 * - Session replay (load and re-run recorded sessions)
 * - Live event log (show all requests/responses in real-time)
 */
export function InspectorUI({ apiUrl }: InspectorUIProps) {
  return (
    <div className="inspector-ui">
      <h1>MCP Studio Inspector</h1>
      <p>Web UI coming soon...</p>
      <p>API URL: {apiUrl}</p>
    </div>
  );
}

// Render the app if this is the entry point
if (typeof window !== "undefined") {
  const root = document.getElementById("root");
  if (root) {
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <InspectorUI apiUrl={window.location.origin} />
      </React.StrictMode>
    );
  }
}
