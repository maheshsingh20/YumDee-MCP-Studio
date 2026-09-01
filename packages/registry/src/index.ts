/**
 * @yumdee/mcp-studio-registry
 *
 * Community-submitted MCP server directory + CLI installer.
 *
 * Exports:
 * - ServerRegistry class - query and manage server listings
 * - ServerListing type - server definition
 * - createRegistry() - factory function
 */

export { ServerRegistry, createRegistry, type ServerListing } from "./registry.js";
