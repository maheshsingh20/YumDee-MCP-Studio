/**
 * @yumdee/mcp-studio-registry
 *
 * Community-submitted MCP server directory + CLI installer.
 *
 * Exports:
 * - ServerRegistry class - query and manage server listings
 * - ServerListing type - server definition
 * - createRegistry() - factory function
 * - DEFAULT_LISTINGS - built-in server catalog
 * - buildServerConfig() - utility for config generation
 */

export {
  ServerRegistry,
  createRegistry,
  buildServerConfig,
  DEFAULT_LISTINGS,
  ServerListingSchema,
  type ServerListing,
} from "./registry.js";
