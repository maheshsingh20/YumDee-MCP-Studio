/**
 * @yumdee/mcp-studio-inspector
 *
 * Web UI debugger for MCP servers with session recording and replay.
 *
 * Exports:
 * - Inspector class - main server
 * - createInspector() - factory function
 * - InspectorConfig - configuration interface
 */

export { Inspector, createInspector, type InspectorConfig } from "./server.js";
export { InspectorUI, type InspectorUIProps } from "./ui.js";
