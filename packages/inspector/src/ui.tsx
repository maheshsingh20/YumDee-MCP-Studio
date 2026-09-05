/**
 * MCP Studio Inspector Frontend UI Entrypoint
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { App, InspectorUIProps } from "./ui/App.js";

export { App, App as InspectorUI, type InspectorUIProps };

if (typeof window !== "undefined") {
  const rootEl = document.getElementById("root");
  if (rootEl) {
    const apiUrl = window.location.port === "5173" ? "http://localhost:3000" : window.location.origin;
    ReactDOM.createRoot(rootEl).render(
      <React.StrictMode>
        <App apiUrl={apiUrl} />
      </React.StrictMode>
    );
  }
}
